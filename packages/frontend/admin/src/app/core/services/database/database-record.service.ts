import { Injectable, inject } from '@angular/core';

import { TableMetadata, Column } from '../../interfaces/database.interface';
import { DatabaseOperationsService } from './database-operations.service';
import { DatabaseFormService } from './database-form.service';
import { DatabaseDraftService } from './database-draft.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseRecordService {
  private dbOperations = inject(DatabaseOperationsService);
  private dbForm = inject(DatabaseFormService);
  private draftService = inject(DatabaseDraftService);

  deleteRecord (table: TableMetadata, id: number, tableData: Record<string, unknown>[]): void {
    this.dbOperations.confirmDelete(id, () => {
      const record = tableData.find(row => row['id'] === id);
      if (!record) return;
      this.dbOperations.createDeleteDraft(table, id, record);
    });
  }

  updateBooleanValue (table: TableMetadata, record: Record<string, unknown>, column: Column, newValue: boolean): void {
    this.dbForm.handleBooleanUpdate(table, record, column, newValue);
  }

  hasRecordDraft (table: TableMetadata, recordId: number): boolean {
    const draftId = `${table.category}:${table.name}:${recordId}`;
    return this.draftService.hasDraftChanges(draftId);
  }

  getRecordDraftData (table: TableMetadata, recordId: number): Record<string, unknown> | null {
    const draft = this.draftService.getDraftForRecord(table.category, table.name, recordId);
    return draft ? draft.draftData : null;
  }

  isRecordMarkedForDeletion (table: TableMetadata, recordId: number): boolean {
    const draft = this.draftService.getDraftForRecord(table.category, table.name, recordId);
    return draft?.operation === 'delete';
  }

  getBooleanValue (
    record: Record<string, unknown>,
    column: string,
    table: TableMetadata,
    getNumberValue: (r: Record<string, unknown>, c: string) => number
  ): boolean {
    const draftData = this.getRecordDraftData(table, getNumberValue(record, 'id'));
    if (draftData && column in draftData) return draftData[column] as boolean;
    return record[column] as boolean;
  }
}
