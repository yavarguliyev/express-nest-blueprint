import { Injectable, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import {
  DatabaseDraft,
  DatabaseOperation,
  BulkOperationRequest,
  BulkOperationResponse,
  ValidationResult,
} from '../interfaces/database-bulk.interface';
import { TokenNotificationService } from './token-notification.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { STORAGE_KEYS } from '@app/common';
import { BaseDraftService } from './base/base-draft.service';
import { PublishResult } from '../interfaces/draft.interface';

@Injectable({
  providedIn: 'root',
})
export class DatabaseDraftService extends BaseDraftService<DatabaseDraft, DatabaseOperation> {
  private http = inject(HttpClient);
  private tokenNotificationService = inject(TokenNotificationService);
  protected readonly DRAFT_STORAGE_KEY = STORAGE_KEYS.DATABASE_DRAFTS;
  protected readonly STORAGE_VERSION = STORAGE_KEYS.DRAFT_STORAGE_VERSION;

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
    super();
  }

  protected buildOperation (draft: DatabaseDraft): DatabaseOperation {
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
  }

  protected executePublish (operations: DatabaseOperation[]): Observable<PublishResult> {
    const request: BulkOperationRequest = { operations };

    return this.http
      .post<{
        success: boolean;
        data: BulkOperationResponse;
        message?: string;
      }>(`${API_ENDPOINTS.ADMIN.BULK_OPERATIONS}?wait=true`, request)
      .pipe(
        map((response) => ({
          success: response.data.success,
          summary: response.data.summary,
          results: response.data.results,
        })),
      );
  }

  protected onPublishSuccess (
    result: PublishResult & { results?: BulkOperationResponse['results'] },
  ): void {
    if (result.success && result.results) {
      const cssTokenOperations = result.results.filter((r) => r.operation.table === 'css_tokens');

      const currentDrafts = this._drafts();
      const newDrafts = new Map(currentDrafts);
      let draftsChanged = false;

      result.results.forEach((operationResult) => {
        if (operationResult.success) {
          const draftId = this.generateDraftId(
            operationResult.operation.category,
            operationResult.operation.table,
            operationResult.operation.recordId,
          );
          if (newDrafts.delete(draftId)) {
            draftsChanged = true;
          }
        }
      });

      if (draftsChanged) {
        this._drafts.set(newDrafts);
        this.saveDraftsToStorage();
      }

      if (cssTokenOperations.length > 0) {
        this.tokenNotificationService.notifyAllTokensUpdated('database');
      }
    }
  }

  createDraft (operation: DatabaseOperation, originalData: Record<string, unknown> | null): void {
    const draftId = this.generateDraftId(operation.category, operation.table, operation.recordId);
    const currentDrafts = this._drafts();

    const draft: DatabaseDraft = {
      id: draftId,
      tableName: operation.table,
      category: operation.category,
      recordId: operation.recordId || 'new',
      operation: operation.type,
      originalData: originalData ? { ...originalData } : {},
      draftData: operation.data ? { ...operation.data } : originalData ? { ...originalData } : {},
      hasChanges: operation.type === 'delete' || !!operation.data,
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

  getDraftForRecord (
    category: string,
    table: string,
    recordId: number | string,
  ): DatabaseDraft | null {
    const draftId = this.generateDraftId(category, table, recordId);
    return this.getDraft(draftId);
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

    const operations: DatabaseOperation[] = allDrafts.map((draft) => this.buildOperation(draft));

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
}
