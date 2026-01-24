import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, finalize } from 'rxjs';
import {
  DatabaseDraft,
  DatabaseOperation,
  BulkOperationRequest,
  BulkOperationResponse,
  DraftStorage,
  ValidationResult,
} from '../interfaces/database-bulk.interface';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class DatabaseDraftService {
  private http = inject(HttpClient);
  private readonly DRAFT_STORAGE_KEY = 'database-drafts';
  private readonly STORAGE_VERSION = '1.0.0';

  private _drafts = signal<Map<string, DatabaseDraft>>(new Map());
  private _loading = signal(false);

  drafts = this._drafts.asReadonly();
  loading = this._loading.asReadonly();

  draftCount = computed(() => {
    const drafts = this._drafts();
    return Array.from(drafts.values()).filter((draft) => draft.hasChanges).length;
  });

  hasDrafts = computed(() => this.draftCount() > 0);

  affectedTables = computed(() => {
    const drafts = this._drafts();
    const tables = new Set<string>();
    Array.from(drafts.values())
      .filter((draft) => draft.hasChanges)
      .forEach((draft) => tables.add(draft.tableName));
    return Array.from(tables);
  });

  affectedCategories = computed(() => {
    const drafts = this._drafts();
    const categories = new Set<string>();
    Array.from(drafts.values())
      .filter((draft) => draft.hasChanges)
      .forEach((draft) => categories.add(draft.category));
    return Array.from(categories);
  });

  constructor () {
    this.loadDraftsFromStorage();
  }

  createDraft (operation: DatabaseOperation, originalData: Record<string, unknown>): void {
    const draftId = this.generateDraftId(operation.category, operation.table, operation.recordId);
    const currentDrafts = this._drafts();

    const draft: DatabaseDraft = {
      id: draftId,
      tableName: operation.table,
      category: operation.category,
      recordId: operation.recordId || 'new',
      operation: operation.type,
      originalData: { ...originalData },
      draftData: { ...originalData },
      hasChanges: operation.type === 'delete' ? true : false,
      timestamp: new Date(),
    };

    const newDrafts = new Map(currentDrafts);
    newDrafts.set(draftId, draft);
    this._drafts.set(newDrafts);
    this.saveDraftsToStorage();
  }

  updateDraft (draftId: string, data: Record<string, unknown>): void {
    const currentDrafts = this._drafts();
    const existingDraft = currentDrafts.get(draftId);

    if (!existingDraft) return;

    const updatedDraft: DatabaseDraft = {
      ...existingDraft,
      draftData: { ...data },
      hasChanges: this.hasDataChanges(existingDraft.originalData, data),
      timestamp: new Date(),
    };

    const newDrafts = new Map(currentDrafts);
    if (updatedDraft.hasChanges) {
      newDrafts.set(draftId, updatedDraft);
    } else {
      newDrafts.delete(draftId);
    }

    this._drafts.set(newDrafts);
    this.saveDraftsToStorage();
  }

  deleteDraft (draftId: string): void {
    const currentDrafts = this._drafts();
    const newDrafts = new Map(currentDrafts);
    newDrafts.delete(draftId);
    this._drafts.set(newDrafts);
    this.saveDraftsToStorage();
  }

  getDraft (draftId: string): DatabaseDraft | null {
    return this._drafts().get(draftId) || null;
  }

  hasDraftChanges (draftId: string): boolean {
    const draft = this._drafts().get(draftId);
    return draft ? draft.hasChanges : false;
  }

  getDraftForRecord (
    category: string,
    table: string,
    recordId: number | string,
  ): DatabaseDraft | null {
    const draftId = this.generateDraftId(category, table, recordId);
    return this.getDraft(draftId);
  }

  publishDrafts (): Observable<BulkOperationResponse> {
    const allDrafts = Array.from(this._drafts().values()).filter((draft) => draft.hasChanges);

    if (allDrafts.length === 0) {
      return new Observable((observer) => {
        observer.next({
          success: true,
          results: [],
          summary: { total: 0, successful: 0, failed: 0 },
        });
        observer.complete();
      });
    }

    this._loading.set(true);

    const operations: DatabaseOperation[] = allDrafts.map((draft) => {
      const operation: DatabaseOperation = {
        type: draft.operation,
        table: draft.tableName,
        category: draft.category,
        recordId: draft.recordId,
      };

      if (draft.operation !== 'delete') {
        operation.data = draft.draftData;
      }

      return operation;
    });

    const request: BulkOperationRequest = { operations };

    return this.http
      .post<{
        success: boolean;
        data: BulkOperationResponse;
        message?: string;
      }>(API_ENDPOINTS.ADMIN.BULK_OPERATIONS, request)
      .pipe(
        map((response) => response.data),
        tap((bulkResponse) => {
          if (bulkResponse.success) {
            bulkResponse.results.forEach((result) => {
              if (result.success) {
                const draftId = this.generateDraftId(
                  result.operation.category,
                  result.operation.table,
                  result.operation.recordId,
                );
                const currentDrafts = this._drafts();
                const newDrafts = new Map(currentDrafts);
                newDrafts.delete(draftId);
                this._drafts.set(newDrafts);
              }
            });
            this.saveDraftsToStorage();
          }
        }),
        finalize(() => {
          this._loading.set(false);
        }),
      );
  }

  resetDrafts (): void {
    this._drafts.set(new Map());
    this.saveDraftsToStorage();
  }

  validateDrafts (): Observable<ValidationResult> {
    const allDrafts = Array.from(this._drafts().values()).filter((draft) => draft.hasChanges);

    if (allDrafts.length === 0) {
      return new Observable((observer) => {
        observer.next({
          valid: true,
          validationResults: [],
          conflicts: [],
        });
        observer.complete();
      });
    }

    const operations: DatabaseOperation[] = allDrafts.map((draft) => {
      const operation: DatabaseOperation = {
        type: draft.operation,
        table: draft.tableName,
        category: draft.category,
        recordId: draft.recordId,
      };

      // Only include data for operations that need it
      if (draft.operation !== 'delete') {
        operation.data = draft.draftData;
      }

      return operation;
    });

    const request: BulkOperationRequest = { operations, validateOnly: true };

    return this.http
      .post<{
        success: boolean;
        data: ValidationResult;
        message?: string;
      }>(API_ENDPOINTS.ADMIN.BULK_OPERATIONS_VALIDATE, request)
      .pipe(map((response) => response.data));
  }

  private generateDraftId (category: string, table: string, recordId?: number | string): string {
    return `${category}:${table}:${recordId || 'new'}`;
  }

  private hasDataChanges (
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

  private saveDraftsToStorage (): void {
    if (typeof window === 'undefined') return;

    const draftsArray = Array.from(this._drafts().entries());
    const storage: DraftStorage = {
      version: this.STORAGE_VERSION,
      timestamp: new Date(),
      drafts: Object.fromEntries(draftsArray),
      metadata: {
        totalChanges: this.draftCount(),
        affectedTables: this.affectedTables(),
        lastModified: new Date(),
      },
    };

    try {
      localStorage.setItem(this.DRAFT_STORAGE_KEY, JSON.stringify(storage));
    } catch {
      // Storage failed - continue without persistence
    }
  }

  private loadDraftsFromStorage (): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.DRAFT_STORAGE_KEY);
      if (!stored) return;

      const storage: DraftStorage = JSON.parse(stored) as DraftStorage;

      if (storage.version !== this.STORAGE_VERSION) {
        localStorage.removeItem(this.DRAFT_STORAGE_KEY);
        return;
      }

      const draftsMap = new Map<string, DatabaseDraft>();
      Object.entries(storage.drafts).forEach(([key, draft]) => {
        draftsMap.set(key, {
          ...draft,
          timestamp: new Date(draft.timestamp),
        });
      });

      this._drafts.set(draftsMap);
    } catch {
      localStorage.removeItem(this.DRAFT_STORAGE_KEY);
    }
  }
}
