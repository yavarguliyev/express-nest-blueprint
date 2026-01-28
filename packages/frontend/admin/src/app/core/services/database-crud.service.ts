import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { DatabaseDraftService } from './database-draft.service';
import { TableMetadata } from './database-operations.service';

@Injectable({
  providedIn: 'root',
})
export class DatabaseCrudService {
  private toastService = inject(ToastService);
  private draftService = inject(DatabaseDraftService);

  createUpdateDraft (
    table: TableMetadata,
    record: Record<string, unknown>,
    formData: Record<string, unknown>
  ): void {
    const recordId = record['id'] as number;

    this.draftService.createDraft(
      {
        type: 'update',
        table: table.name,
        category: table.category,
        recordId: recordId,
        data: formData,
      },
      record,
    );
  }

  createDeleteDraft (table: TableMetadata, recordId: number, record: Record<string, unknown>): void {
    this.draftService.createDraft(
      {
        type: 'delete',
        table: table.name,
        category: table.category,
        recordId: recordId,
      },
      record,
    );
  }

  confirmDelete (recordId: number, onConfirm: () => void): void {
    this.toastService.confirm(
      `Mark record ${recordId} for deletion? You can review and apply all changes with "Save Changes".`,
      onConfirm,
    );
  }
}