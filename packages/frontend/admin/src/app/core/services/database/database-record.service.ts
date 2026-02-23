import { Injectable, inject } from '@angular/core';

import { DatabaseOperationsService } from './database-operations.service';
import { DatabaseFormService } from './database-form.service';
import { DatabaseDraftService } from './database-draft.service';
import { DeleteRecordParams, GetBooleanValueParams, HandleBooleanUpdateParams, RecordDraftParams } from '../../interfaces/database-service-params.interface';

@Injectable({
  providedIn: 'root'
})
export class DatabaseRecordService {
  private dbOperations = inject(DatabaseOperationsService);
  private dbForm = inject(DatabaseFormService);
  private draftService = inject(DatabaseDraftService);

  deleteRecord (params: DeleteRecordParams): void {
    const { table, id, tableData } = params;
    this.dbOperations.confirmDelete(id, () => {
      const record = tableData.find(row => row['id'] === id);
      if (!record) return;
      this.dbOperations.createDeleteDraft(table, id, record);
    });
  }

  updateBooleanValue (params: HandleBooleanUpdateParams): void {
    this.dbForm.handleBooleanUpdate(params);
  }

  hasRecordDraft (params: RecordDraftParams): boolean {
    const { table, recordId } = params;
    const draftId = `${table.category}:${table.name}:${recordId}`;
    return this.draftService.hasDraftChanges(draftId);
  }

  getRecordDraftData (params: RecordDraftParams): Record<string, unknown> | null {
    const { table, recordId } = params;
    const draft = this.draftService.getDraftForRecord(table.category, table.name, recordId);
    return draft ? draft.draftData : null;
  }

  isRecordMarkedForDeletion (params: RecordDraftParams): boolean {
    const { table, recordId } = params;
    const draft = this.draftService.getDraftForRecord(table.category, table.name, recordId);
    return draft?.operation === 'delete';
  }

  getBooleanValue (params: GetBooleanValueParams): boolean {
    const { record, column, table, getNumberValue } = params;
    const draftData = this.getRecordDraftData({ table, recordId: getNumberValue(record, 'id') });
    if (draftData && column in draftData) return draftData[column] as boolean;
    return record[column] as boolean;
  }
}
