import { signal, computed, Signal } from '@angular/core';
import { Observable } from 'rxjs';

export interface BaseDraft {
  id: string;
  hasChanges: boolean;
  timestamp: Date;
}

export interface DraftStorageMetadata {
  totalChanges: number;
  lastModified: Date;
}

export interface BaseDraftStorage<T extends BaseDraft> {
  version: string;
  timestamp: Date;
  drafts: Record<string, T>;
  metadata: DraftStorageMetadata;
}

export interface PublishResult {
  success: boolean;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export abstract class BaseDraftService<TDraft extends BaseDraft, TOperation> {
  protected abstract readonly DRAFT_STORAGE_KEY: string;
  protected abstract readonly STORAGE_VERSION: string;

  protected _drafts = signal<Map<string, TDraft>>(new Map());
  protected _loading = signal(false);

  drafts: Signal<Map<string, TDraft>> = this._drafts.asReadonly();
  loading: Signal<boolean> = this._loading.asReadonly();

  draftCount = computed(() => {
    const drafts = this._drafts();
    return Array.from(drafts.values()).filter((draft) => draft.hasChanges).length;
  });

  hasDrafts = computed(() => this.draftCount() > 0);

  protected abstract buildOperation (draft: TDraft): TOperation;
  protected abstract executePublish (operations: TOperation[]): Observable<PublishResult>;
  protected abstract onPublishSuccess (result: PublishResult): void;

  constructor () {
    this.loadDraftsFromStorage();
  }

  getDraft (draftId: string): TDraft | null {
    return this._drafts().get(draftId) || null;
  }

  hasDraftChanges (draftId: string): boolean {
    const draft = this._drafts().get(draftId);
    return draft ? draft.hasChanges : false;
  }

  deleteDraft (draftId: string): void {
    const currentDrafts = this._drafts();
    const newDrafts = new Map(currentDrafts);
    newDrafts.delete(draftId);
    this._drafts.set(newDrafts);
    this.saveDraftsToStorage();
  }

  publishDrafts (): Observable<PublishResult> {
    const allDrafts = Array.from(this._drafts().values()).filter((draft) => draft.hasChanges);

    if (allDrafts.length === 0) {
      return new Observable((observer) => {
        observer.next({
          success: true,
          summary: { total: 0, successful: 0, failed: 0 },
        });
        observer.complete();
      });
    }

    this._loading.set(true);

    const operations: TOperation[] = allDrafts.map((draft) => this.buildOperation(draft));

    return new Observable((observer) => {
      this.executePublish(operations).subscribe({
        next: (result) => {
          this.onPublishSuccess(result);
          this._loading.set(false);
          observer.next(result);
          observer.complete();
        },
        error: (error) => {
          this._loading.set(false);
          observer.error(error);
        },
      });
    });
  }

  resetDrafts (): void {
    this._drafts.set(new Map());
    this.saveDraftsToStorage();
  }

  protected saveDraftsToStorage (): void {
    if (typeof window === 'undefined') return;

    const draftsArray = Array.from(this._drafts().entries());
    const storage: BaseDraftStorage<TDraft> = {
      version: this.STORAGE_VERSION,
      timestamp: new Date(),
      drafts: Object.fromEntries(draftsArray),
      metadata: {
        totalChanges: this.draftCount(),
        lastModified: new Date(),
      },
    };

    localStorage.setItem(this.DRAFT_STORAGE_KEY, JSON.stringify(storage));
  }

  protected loadDraftsFromStorage (): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.DRAFT_STORAGE_KEY);
      if (!stored) return;

      const storage: BaseDraftStorage<TDraft> = JSON.parse(stored) as BaseDraftStorage<TDraft>;

      if (storage.version !== this.STORAGE_VERSION) {
        localStorage.removeItem(this.DRAFT_STORAGE_KEY);
        return;
      }

      const draftsMap = new Map<string, TDraft>();
      Object.entries(storage.drafts).forEach(([key, draft]) => {
        draftsMap.set(key, {
          ...draft,
          timestamp: new Date(draft.timestamp),
        } as TDraft);
      });

      this._drafts.set(draftsMap);
    } catch {
      localStorage.removeItem(this.DRAFT_STORAGE_KEY);
    }
  }

  protected hasDataChanges (
    original: Record<string, unknown>,
    modified: Record<string, unknown>,
  ): boolean {
    const originalKeys = Object.keys(original);
    const modifiedKeys = Object.keys(modified);

    if (originalKeys.length !== modifiedKeys.length) {
      return true;
    }

    for (const key of originalKeys) {
      if (original[key] !== modified[key]) {
        return true;
      }
    }

    return false;
  }
}
