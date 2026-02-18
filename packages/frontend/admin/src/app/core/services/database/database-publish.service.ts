import { Injectable, inject } from '@angular/core';

import { DatabaseDraftService } from './database-draft.service';
import { ToastService } from '../ui/toast.service';
import { BulkOperationResponse } from '../../interfaces/database.interface';
import { ErrorResponse } from '../../interfaces/common.interface';

@Injectable({
  providedIn: 'root'
})
export class DatabasePublishService {
  private draftService = inject(DatabaseDraftService);
  private toastService = inject(ToastService);

  publishAllChanges (hasDrafts: boolean, isPublishing: (value: boolean) => void, loadTableData: () => void): void {
    if (!hasDrafts) {
      this.toastService.info('No changes to publish');
      return;
    }

    isPublishing(true);

    this.draftService.publishDrafts().subscribe({
      next: response => this.handlePublishSuccess(response, isPublishing, loadTableData),
      error: error => this.handlePublishError(error, isPublishing)
    });
  }

  resetAllChanges (hasDrafts: boolean, draftCount: number, loadTableData: () => void): void {
    if (!hasDrafts) {
      this.toastService.info('No changes to reset');
      return;
    }

    this.toastService.confirm(`Reset all ${draftCount} unsaved changes? This cannot be undone.`, () => {
      this.draftService.resetDrafts();
      loadTableData();
      this.toastService.success('All changes have been reset');
    });
  }

  private handlePublishSuccess (response: BulkOperationResponse, isPublishing: (value: boolean) => void, loadTableData: () => void): void {
    isPublishing(false);

    if (response.success) {
      this.toastService.success(`Successfully published ${response.summary.successful} changes`);
      loadTableData();
    } else {
      this.toastService.error(`Published ${response.summary.successful} changes, ${response.summary.failed} failed`);
    }
  }

  private handlePublishError (error: unknown, isPublishing: (value: boolean) => void): void {
    const err = error as ErrorResponse;
    isPublishing(false);
    this.toastService.error(err?.error?.message || err?.message || 'Failed to publish changes');
  }
}
