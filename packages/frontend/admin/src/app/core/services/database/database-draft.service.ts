import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DatabaseDraft, DatabaseOperation, BulkOperationResponse, ValidationResult } from '../../interfaces/database.interface';
import { TokenNotificationService } from '../theme/token-notification.service';
import { DraftOperationsUtility } from '../utilities/draft-operations.service';
import { DraftManager } from './helpers/draft-manager';
import { DraftPublisher } from './helpers/draft-publisher';

@Injectable({
  providedIn: 'root'
})
export class DatabaseDraftService {
  private http = inject(HttpClient);
  private tokenNotificationService = inject(TokenNotificationService);
  private _loading = signal(false);
  private draftManager = new DraftManager();
  private draftPublisher = new DraftPublisher(
    this.http,
    this.tokenNotificationService,
    loading => this._loading.set(loading),
    draftIds => this.draftManager.removeDrafts(draftIds)
  );

  drafts = this.draftManager.drafts;
  loading = this._loading.asReadonly();
  draftCount = this.draftManager.draftCount;
  hasDrafts = this.draftManager.hasDrafts;
  affectedTables = this.draftManager.affectedTables;
  affectedCategories = this.draftManager.affectedCategories;

  createDraft (operation: DatabaseOperation, originalData: Record<string, unknown> | null): void {
    this.draftManager.createDraft(operation, originalData);
  }

  updateDraft (draftId: string, data: Record<string, unknown>): void {
    this.draftManager.updateDraft(draftId, data);
  }

  deleteDraft (draftId: string): void {
    this.draftManager.deleteDraft(draftId);
  }

  getDraft (draftId: string): DatabaseDraft | null {
    return this.draftManager.getDraft(draftId);
  }

  hasDraftChanges (draftId: string): boolean {
    return this.draftManager.hasDraftChanges(draftId);
  }

  getDraftForRecord (category: string, table: string, recordId: number | string): DatabaseDraft | null {
    return this.draftManager.getDraftForRecord(category, table, recordId);
  }

  publishDrafts (): Observable<BulkOperationResponse> {
    const allDrafts = this.draftManager.getAllDraftsWithChanges();
    const operations = DraftOperationsUtility.convertDraftsToOperations(allDrafts);
    return this.draftPublisher.publishDrafts(operations);
  }

  resetDrafts (): void {
    this.draftManager.resetDrafts();
  }

  validateDrafts (): Observable<ValidationResult> {
    const allDrafts = this.draftManager.getAllDraftsWithChanges();
    const operations = DraftOperationsUtility.convertDraftsToOperations(allDrafts);
    return this.draftPublisher.validateDrafts(operations);
  }
}
