import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, finalize } from 'rxjs';

import { DatabaseDraft, DatabaseOperation, BulkOperationRequest, BulkOperationResponse, ValidationResult } from '../../interfaces/database.interface';
import { TokenNotificationService } from '../theme/token-notification.service';
import { API_ENDPOINTS } from '../../constants/api.constants';
import { DraftStorageUtility } from '../utilities/draft-storage.service';
import { DraftOperationsUtility } from '../utilities/draft-operations.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseDraftService {
  private http = inject(HttpClient);
  private tokenNotificationService = inject(TokenNotificationService);

  private _drafts = signal<Map<string, DatabaseDraft>>(new Map());
  private _loading = signal(false);

  drafts = this._drafts.asReadonly();
  loading = this._loading.asReadonly();

  draftCount = computed(() => {
    return Array.from(this._drafts().values()).filter(draft => draft.hasChanges).length;
  });

  hasDrafts = computed(() => this.draftCount() > 0);

  affectedTables = computed(() => {
    const drafts = this._drafts();
    const tables = new Set<string>();

    Array.from(drafts.values())
      .filter(draft => draft.hasChanges)
      .forEach(draft => tables.add(draft.tableName));

    return Array.from(tables);
  });

  affectedCategories = computed(() => {
    const drafts = this._drafts();
    const categories = new Set<string>();

    Array.from(drafts.values())
      .filter(draft => draft.hasChanges)
      .forEach(draft => categories.add(draft.category));

    return Array.from(categories);
  });

  constructor () {
    this._drafts.set(DraftStorageUtility.loadDrafts());
  }

  createDraft (operation: DatabaseOperation, originalData: Record<string, unknown> | null): void {
    const draftId = DraftOperationsUtility.generateDraftId(operation.category, operation.table, operation.recordId);
    const draft = DraftOperationsUtility.createDraftObject(operation, originalData, draftId);
    const newDrafts = new Map(this._drafts());

    newDrafts.set(draftId, draft);
    this._drafts.set(newDrafts);
    this.saveDrafts();
  }

  updateDraft (draftId: string, data: Record<string, unknown>): void {
    const currentDrafts = this._drafts();
    const existingDraft = currentDrafts.get(draftId);

    if (!existingDraft) return;

    const hasChanges = DraftOperationsUtility.hasDataChanges(existingDraft.originalData, data);
    const updatedDraft: DatabaseDraft = {
      ...existingDraft,
      draftData: { ...data },
      hasChanges,
      timestamp: new Date()
    };

    const newDrafts = new Map(currentDrafts);

    if (hasChanges) newDrafts.set(draftId, updatedDraft);
    else newDrafts.delete(draftId);

    this._drafts.set(newDrafts);
    this.saveDrafts();
  }

  deleteDraft (draftId: string): void {
    const newDrafts = new Map(this._drafts());
    newDrafts.delete(draftId);
    this._drafts.set(newDrafts);
    this.saveDrafts();
  }

  getDraft (draftId: string): DatabaseDraft | null {
    return this._drafts().get(draftId) || null;
  }

  hasDraftChanges (draftId: string): boolean {
    const draft = this._drafts().get(draftId);
    return draft ? draft.hasChanges : false;
  }

  getDraftForRecord (category: string, table: string, recordId: number | string): DatabaseDraft | null {
    const draftId = DraftOperationsUtility.generateDraftId(category, table, recordId);
    return this.getDraft(draftId);
  }

  publishDrafts (): Observable<BulkOperationResponse> {
    const allDrafts = Array.from(this._drafts().values()).filter(draft => draft.hasChanges);

    if (allDrafts.length === 0) {
      return new Observable(observer => {
        observer.next({
          success: true,
          results: [],
          summary: { total: 0, successful: 0, failed: 0 }
        });
        observer.complete();
      });
    }

    this._loading.set(true);
    const operations = DraftOperationsUtility.convertDraftsToOperations(allDrafts);
    const request: BulkOperationRequest = { operations };

    return this.http
      .post<{ success: boolean; data: BulkOperationResponse; message?: string }>(`${API_ENDPOINTS.ADMIN.BULK_OPERATIONS}?wait=true`, request)
      .pipe(
        map(response => response.data),
        tap(bulkResponse => this.handlePublishSuccess(bulkResponse, operations)),
        finalize(() => this._loading.set(false))
      );
  }

  resetDrafts (): void {
    this._drafts.set(new Map());
    this.saveDrafts();
  }

  validateDrafts (): Observable<ValidationResult> {
    const allDrafts = Array.from(this._drafts().values()).filter(draft => draft.hasChanges);

    if (allDrafts.length === 0) {
      return new Observable(observer => {
        observer.next({ valid: true, validationResults: [], conflicts: [] });
        observer.complete();
      });
    }

    const operations = DraftOperationsUtility.convertDraftsToOperations(allDrafts);
    const request: BulkOperationRequest = { operations, validateOnly: true };

    return this.http
      .post<{ success: boolean; data: ValidationResult; message?: string }>(API_ENDPOINTS.ADMIN.BULK_OPERATIONS_VALIDATE, request)
      .pipe(map(response => response.data));
  }

  private handlePublishSuccess (bulkResponse: BulkOperationResponse, operations: DatabaseOperation[]): void {
    if (!bulkResponse.success || !bulkResponse.results) return;

    const cssTokenOperations = operations.filter(op => op.table === 'css_tokens');
    const newDrafts = new Map(this._drafts());
    let draftsChanged = false;

    bulkResponse.results.forEach(result => {
      if (result.success) {
        const draftId = DraftOperationsUtility.generateDraftId(result.operation.category, result.operation.table, result.operation.recordId);
        if (newDrafts.delete(draftId)) draftsChanged = true;
      }
    });

    if (draftsChanged) {
      this._drafts.set(newDrafts);
      this.saveDrafts();
    }

    if (cssTokenOperations.length > 0) this.tokenNotificationService.notifyAllTokensUpdated('database');
  }

  private saveDrafts (): void {
    DraftStorageUtility.saveDrafts(this._drafts(), this.draftCount(), this.affectedTables());
  }
}
