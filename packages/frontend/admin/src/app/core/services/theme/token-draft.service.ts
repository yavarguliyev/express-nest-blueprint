import { Injectable, signal, computed } from '@angular/core';

import { TokenDraft } from '../../interfaces/theme.interface';

@Injectable({
  providedIn: 'root'
})
export class TokenDraftService {
  private readonly DRAFT_STORAGE_KEY = 'theme-editor-drafts';
  private _drafts = signal<Map<string, TokenDraft>>(new Map());

  drafts = this._drafts.asReadonly();
  draftCount = computed(() => Array.from(this._drafts().values()).filter(draft => draft.hasChanges).length);
  hasDrafts = computed(() => this.draftCount() > 0);

  constructor () {
    this.loadDraftsFromStorage();
  }

  createOrUpdateDraft (draft: TokenDraft): void {
    const currentDrafts = this._drafts();
    const newDrafts = new Map(currentDrafts);
    if (draft.hasChanges) newDrafts.set(draft.id, draft);
    else newDrafts.delete(draft.id);
    this._drafts.set(newDrafts);
    this.saveDraftsToStorage();
  }

  getDraft (tokenId: string): TokenDraft | null {
    return this._drafts().get(tokenId) || null;
  }

  hasTokenChanges (tokenId: string): boolean {
    const draft = this._drafts().get(tokenId);
    return draft?.hasChanges || false;
  }

  clearDrafts (): void {
    this._drafts.set(new Map());
    this.saveDraftsToStorage();
  }

  getAllDraftsForPublish (): TokenDraft[] {
    return Array.from(this._drafts().values()).filter(draft => draft.hasChanges);
  }

  private saveDraftsToStorage (): void {
    if (typeof window === 'undefined') return;
    const draftsArray = Array.from(this._drafts().entries());
    localStorage.setItem(this.DRAFT_STORAGE_KEY, JSON.stringify(draftsArray));
  }

  private loadDraftsFromStorage (): void {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(this.DRAFT_STORAGE_KEY);
    if (stored) {
      const draftsArray = JSON.parse(stored) as [string, TokenDraft][];
      this._drafts.set(new Map(draftsArray));
    }
  }
}
