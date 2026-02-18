import { DRAFT_STORAGE_KEY, STORAGE_VERSION } from '../../constants/draft.const';
import { DatabaseDraft, DraftStorage } from '../../interfaces/database.interface';

export class DraftStorageUtility {
  static saveDrafts (drafts: Map<string, DatabaseDraft>, draftCount: number, affectedTables: string[]): void {
    if (typeof window === 'undefined') return;

    const draftsArray = Array.from(drafts.entries());
    const storage: DraftStorage = {
      version: STORAGE_VERSION,
      timestamp: new Date(),
      drafts: Object.fromEntries(draftsArray),
      metadata: {
        totalChanges: draftCount,
        affectedTables,
        lastModified: new Date()
      }
    };

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(storage));
  }

  static loadDrafts (): Map<string, DatabaseDraft> {
    if (typeof window === 'undefined') return new Map();

    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!stored) return new Map();

      const storage: DraftStorage = JSON.parse(stored) as DraftStorage;

      if (storage.version !== STORAGE_VERSION) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        return new Map();
      }

      const draftsMap = new Map<string, DatabaseDraft>();
      Object.entries(storage.drafts).forEach(([key, draft]) => {
        draftsMap.set(key, {
          ...draft,
          timestamp: new Date(draft.timestamp)
        });
      });

      return draftsMap;
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return new Map();
    }
  }

  static clearDrafts (): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }
}
