import { Injectable, inject } from '@angular/core';

import { FormDataPreparer } from './helpers/form-data-preparer';
import { FormValidator } from './helpers/form-validator';
import { FormUIHelper } from './helpers/form-ui-helper';
import { TableMetadata, Column } from '../../interfaces/database.interface';

@Injectable({
  providedIn: 'root'
})
export class DatabaseFormService {
  private dataPreparer = inject(FormDataPreparer);
  private validator = inject(FormValidator);
  private uiHelper = inject(FormUIHelper);

  prepareFormData (table: TableMetadata, record: Record<string, unknown>): Record<string, unknown> {
    return this.dataPreparer.prepareFormData(table, record);
  }

  prepareCreateFormData (table: TableMetadata): Record<string, unknown> {
    return this.dataPreparer.prepareCreateFormData(table);
  }

  validateAndSubmitUpdate (
    table: TableMetadata,
    record: Record<string, unknown>,
    currentData: Record<string, unknown>,
    originalData: Record<string, unknown>
  ): boolean {
    return this.validator.validateAndSubmitUpdate(table, record, currentData, originalData);
  }

  validateAndSubmitCreate (table: TableMetadata, formData: Record<string, unknown>): boolean {
    return this.validator.validateAndSubmitCreate(table, formData);
  }

  getModalTitle (mode: 'create' | 'update'): string {
    return this.uiHelper.getModalTitle(mode);
  }

  getSubmitButtonText (mode: 'create' | 'update', hasChanges: boolean): string {
    return this.uiHelper.getSubmitButtonText(mode, hasChanges);
  }

  getSubmitButtonIcon (mode: 'create' | 'update'): string {
    return this.uiHelper.getSubmitButtonIcon(mode);
  }

  handleBooleanUpdate (table: TableMetadata, record: Record<string, unknown>, column: Column, newValue: boolean): void {
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
