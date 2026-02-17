import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';

import { BaseDraft, DraftStorage } from '../../../domain/types/state.type';
import { PublishResult } from '../../../domain/interfaces/common.interface';
import { StorageService } from './storage.service';

@Injectable()
export abstract class BaseDraftService<TDraft extends BaseDraft, TOperation> {
  protected readonly storageService = inject(StorageService);
  protected abstract readonly DRAFT_STORAGE_KEY: string;
  protected abstract readonly STORAGE_VERSION: string;
  protected _drafts = signal<Map<string, TDraft>>(new Map());
  protected _loading = signal(false);

  readonly drafts: Signal<Map<string, TDraft>> = this._drafts.asReadonly();
  readonly loading: Signal<boolean> = this._loading.asReadonly();

  readonly draftCount: Signal<number> = computed(() => {
    const drafts = this._drafts();
    return Array.from(drafts.values()).filter(d => d.hasChanges).length;
  });

  readonly hasDrafts: Signal<boolean> = computed(() => this.draftCount() > 0);
  readonly draftList: Signal<TDraft[]> = computed(() => Array.from(this._drafts().values()));

  constructor () {
    this.loadDraftsFromStorage();
  }

  protected abstract buildOperation(draft: TDraft): TOperation;
  protected abstract executePublish(operations: TOperation[]): Observable<PublishResult>;
  protected abstract onPublishSuccess(result: PublishResult): void;

  getDraft (draftId: string): TDraft | null {
    return this._drafts().get(draftId) || null;
  }

  createDraft (draft: TDraft): void {
    this._drafts.update(drafts => {
      const newDrafts = new Map(drafts);
      newDrafts.set(draft.id, draft);
      return newDrafts;
    });
    this.saveDraftsToStorage();
  }

  updateDraft (draftId: string, updates: Partial<TDraft>): void {
    this._drafts.update(drafts => {
      const newDrafts = new Map(drafts);
      const existing = newDrafts.get(draftId);
      if (existing) {
        newDrafts.set(draftId, {
          ...existing,
          ...updates,
          timestamp: new Date(),
          hasChanges: true
        });
      }
      return newDrafts;
    });
    this.saveDraftsToStorage();
  }

  deleteDraft (draftId: string): void {
    this._drafts.update(drafts => {
      const newDrafts = new Map(drafts);
      newDrafts.delete(draftId);
      return newDrafts;
    });
    this.saveDraftsToStorage();
  }

  publishDrafts (): Observable<PublishResult> {
    const drafts = Array.from(this._drafts().values()).filter(d => d.hasChanges);
    const operations = drafts.map(draft => this.buildOperation(draft));

    this._loading.set(true);

    return this.executePublish(operations).pipe(
      tap(result => {
        this.onPublishSuccess(result);
        result.publishedIds.forEach(id => this.deleteDraft(String(id)));
      }),
      finalize(() => this._loading.set(false))
    );
  }

  resetDrafts (): void {
    this._drafts.set(new Map());
    this.storageService.remove(this.DRAFT_STORAGE_KEY);
  }

  protected saveDraftsToStorage (): void {
    const drafts = this._drafts();
    const storage: DraftStorage<TDraft> = {
      version: this.STORAGE_VERSION,
      timestamp: new Date(),
      drafts: Object.fromEntries(drafts),
      metadata: {
        totalChanges: this.draftCount(),
        lastModified: new Date()
      }
    };

    this.storageService.set(this.DRAFT_STORAGE_KEY, storage, {
      version: this.STORAGE_VERSION
    });
  }

  protected loadDraftsFromStorage (): void {
    const storage = this.storageService.get<DraftStorage<TDraft>>(this.DRAFT_STORAGE_KEY, { version: this.STORAGE_VERSION });

    if (storage && storage.drafts) {
      const draftsMap = new Map(Object.entries(storage.drafts));
      this._drafts.set(draftsMap);
    }
  }
}
