import { Injectable, inject } from '@angular/core';

import { FormDataPreparer } from './helpers/form-data-preparer';
import { FormValidator } from './helpers/form-validator';
import { FormUIHelper } from './helpers/form-ui-helper';
import { TableMetadata } from '../../interfaces/database.interface';
import {
  HandleBooleanUpdateParams,
  PrepareFormDataParams,
  SubmitButtonTextParams,
  ValidateAndSubmitUpdateParams
} from '../../interfaces/database-service-params.interface';

@Injectable({
  providedIn: 'root'
})
export class DatabaseFormService {
  private dataPreparer = inject(FormDataPreparer);
  private validator = inject(FormValidator);
  private uiHelper = inject(FormUIHelper);

  prepareFormData (params: PrepareFormDataParams): Record<string, unknown> {
    const { table, record } = params;
    return this.dataPreparer.prepareFormData(table, record);
  }

  prepareCreateFormData (table: TableMetadata): Record<string, unknown> {
    return this.dataPreparer.prepareCreateFormData(table);
  }

  validateAndSubmitUpdate (params: ValidateAndSubmitUpdateParams): boolean {
    const { table, record, currentData, originalData } = params;
    return this.validator.validateAndSubmitUpdate(table, record, currentData, originalData);
  }

  validateAndSubmitCreate (table: TableMetadata, formData: Record<string, unknown>): boolean {
    return this.validator.validateAndSubmitCreate(table, formData);
  }

  getModalTitle (mode: 'create' | 'update'): string {
    return this.uiHelper.getModalTitle(mode);
  }

  getSubmitButtonText (params: SubmitButtonTextParams): string {
    const { mode, hasChanges } = params;
    return this.uiHelper.getSubmitButtonText(mode, hasChanges);
  }

  getSubmitButtonIcon (mode: 'create' | 'update'): string {
    return this.uiHelper.getSubmitButtonIcon(mode);
  }

  handleBooleanUpdate (params: HandleBooleanUpdateParams): void {
    const { table, record, column, newValue } = params;
    this.uiHelper.handleBooleanUpdate(table, record, column, newValue);
  }

  isCurrentUser (id: number): boolean {
    return this.uiHelper.isCurrentUser(id);
  }

  isRestrictedTable (table: TableMetadata | null): boolean {
    return this.uiHelper.isRestrictedTable(table);
  }

  canDeleteRecord (record: Record<string, unknown>, table: TableMetadata | null): boolean {
    return this.uiHelper.canDeleteRecord(record, table);
  }
}
