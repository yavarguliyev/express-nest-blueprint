import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, finalize } from 'rxjs';

import { BulkOperationRequest, BulkOperationResponse, ValidationResult, DatabaseOperation } from '../../../interfaces/database.interface';
import { TokenNotificationService } from '../../theme/token-notification.service';
import { API_ENDPOINTS } from '../../../constants/api.constants';
import { DraftOperationsUtility } from '../../utilities/draft-operations.service';

export class DraftPublisher {
  constructor (
    private http: HttpClient,
    private tokenNotificationService: TokenNotificationService,
    private onLoadingChange: (loading: boolean) => void,
    private onDraftsRemoved: (draftIds: string[]) => void
  ) {}

  publishDrafts (operations: DatabaseOperation[]): Observable<BulkOperationResponse> {
    if (operations.length === 0) {
      return new Observable(observer => {
        observer.next({
          success: true,
          results: [],
          summary: { total: 0, successful: 0, failed: 0 }
        });
        observer.complete();
      });
    }

    this.onLoadingChange(true);
    const request: BulkOperationRequest = { operations };

    return this.http
      .post<{ success: boolean; data: BulkOperationResponse; message?: string }>(`${API_ENDPOINTS.ADMIN.BULK_OPERATIONS}?wait=true`, request)
      .pipe(
        map(response => response.data),
        tap(bulkResponse => this.handlePublishSuccess(bulkResponse, operations)),
        finalize(() => this.onLoadingChange(false))
      );
  }

  validateDrafts (operations: DatabaseOperation[]): Observable<ValidationResult> {
    if (operations.length === 0) {
      return new Observable(observer => {
        observer.next({ valid: true, validationResults: [], conflicts: [] });
        observer.complete();
      });
    }

    const request: BulkOperationRequest = { operations, validateOnly: true };

    return this.http
      .post<{ success: boolean; data: ValidationResult; message?: string }>(API_ENDPOINTS.ADMIN.BULK_OPERATIONS_VALIDATE, request)
      .pipe(map(response => response.data));
  }

  private handlePublishSuccess (bulkResponse: BulkOperationResponse, operations: DatabaseOperation[]): void {
    if (!bulkResponse.success || !bulkResponse.results) return;

    const cssTokenOperations = operations.filter(op => op.table === 'css_tokens');
    const successfulDraftIds: string[] = [];

    bulkResponse.results.forEach(result => {
      if (result.success) {
        const draftId = DraftOperationsUtility.generateDraftId(result.operation.category, result.operation.table, result.operation.recordId);
        successfulDraftIds.push(draftId);
      }
    });

    if (successfulDraftIds.length > 0) this.onDraftsRemoved(successfulDraftIds);
    if (cssTokenOperations.length > 0) this.tokenNotificationService.notifyAllTokensUpdated('database');
  }
}
