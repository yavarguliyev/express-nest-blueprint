import { Injectable, inject } from '@angular/core';

import { ToastService } from '../../ui/toast.service';
import { DatabaseDraftService } from '../database-draft.service';
import { FormValidationService } from '../../validation/form-validation.service';
import { FieldAccessService } from '../../validation/field-access.service';
import { TableMetadata } from '../../../interfaces/database.interface';

@Injectable({
  providedIn: 'root'
})
export class FormValidator {
  private toastService = inject(ToastService);
  private draftService = inject(DatabaseDraftService);
  private formValidation = inject(FormValidationService);
  private fieldAccess = inject(FieldAccessService);

  validateAndSubmitUpdate (
    table: TableMetadata,
    record: Record<string, unknown>,
    currentData: Record<string, unknown>,
    originalData: Record<string, unknown>
  ): boolean {
    const changedData = this.getChangedData(currentData, originalData);

    if (Object.keys(changedData).length === 0) {
      this.toastService.error('No changes detected to update.');
      return false;
    }

    if (this.formValidation.validateRole(changedData)) {
      this.toastService.error('Please select a valid role before updating the record.');
      return false;
    }

    this.createOrUpdateDraft(table, record, currentData);
    return true;
  }

  validateAndSubmitCreate (table: TableMetadata, formData: Record<string, unknown>): boolean {
    const editableColumns = table.columns.filter(col => col.editable && !this.fieldAccess.isFieldExcludedFromUpdate(col.name, null));

    const errors = this.formValidation.validateFormData(
      formData,
      editableColumns.map(col => ({ name: col.name, required: col.required }))
    );

    if (errors.length > 0) {
      this.toastService.error(`Please fix the following errors: ${errors.join(', ')}`);
      return false;
    }

    if (this.formValidation.validateRole(formData)) {
      this.toastService.error('Please select a valid role before creating the record.');
      return false;
    }

    if (!this.validatePasswordIfPresent(formData)) return false;

    this.draftService.createDraft(
      {
        type: 'create',
        table: table.name,
        category: table.category,
        data: formData
      },
      null
    );

    return true;
  }

  private getChangedData (currentData: Record<string, unknown>, originalData: Record<string, unknown>): Record<string, unknown> {
    const changedData: Record<string, unknown> = {};

    for (const key in currentData) {
      if (Object.prototype.hasOwnProperty.call(currentData, key) && currentData[key] !== originalData[key]) {
        changedData[key] = currentData[key];
      }
    }

    return changedData;
  }

  private createOrUpdateDraft (table: TableMetadata, record: Record<string, unknown>, currentData: Record<string, unknown>): void {
    const recordId = record['id'] as number;
    const draftId = `${table.category}:${table.name}:${recordId}`;

    if (!this.draftService.hasDraftChanges(draftId)) {
      this.draftService.createDraft(
        {
          type: 'update',
          table: table.name,
          category: table.category,
          recordId: recordId,
          data: currentData
        },
        record
      );
    } else {
      this.draftService.updateDraft(draftId, currentData);
    }
  }

  private validatePasswordIfPresent (formData: Record<string, unknown>): boolean {
    if (Object.prototype.hasOwnProperty.call(formData, 'password')) {
      const password = formData['password'] as string;
      if (!this.formValidation.validatePassword(password)) {
        this.toastService.error('Password must be at least 8 characters long.');
        return false;
      }
    }

    return true;
  }
}
