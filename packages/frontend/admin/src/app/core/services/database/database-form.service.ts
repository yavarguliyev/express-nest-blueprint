import { Injectable, inject } from '@angular/core';

import { ToastService } from '../ui/toast.service';
import { DatabaseDraftService } from './database-draft.service';
import { AuthService } from '../auth/auth.service';
import { FormValidationService } from '../validation/form-validation.service';
import { FieldAccessService } from '../validation/field-access.service';
import { UserRoleHelper } from '../utilities/user-role-utility.service';
import { TableMetadata, Column } from '../../interfaces/database.interface';

@Injectable({
  providedIn: 'root'
})
export class DatabaseFormService {
  private toastService = inject(ToastService);
  private draftService = inject(DatabaseDraftService);
  private authService = inject(AuthService);
  private formValidation = inject(FormValidationService);
  private fieldAccess = inject(FieldAccessService);

  prepareFormData (table: TableMetadata, record: Record<string, unknown>): Record<string, unknown> {
    const formData: Record<string, unknown> = {};

    table.columns.forEach(col => {
      if (col.editable && !this.fieldAccess.isFieldExcludedFromUpdate(col.name)) {
        formData[col.name] = record[col.name];
      }
    });

    return formData;
  }

  prepareCreateFormData (table: TableMetadata): Record<string, unknown> {
    const formData: Record<string, unknown> = {};

    table.columns.forEach(col => {
      if (col.editable && !this.fieldAccess.isFieldExcludedFromUpdate(col.name, null)) {
        formData[col.name] = col.type === 'boolean' ? false : '';
      }
    });

    const hasEmail = table.columns.some(c => c.name === 'email');
    const hasPassword = table.columns.some(c => c.name === 'password');

    if (hasEmail && !hasPassword) formData['password'] = '';

    return formData;
  }

  validateAndSubmitUpdate (
    table: TableMetadata,
    record: Record<string, unknown>,
    currentData: Record<string, unknown>,
    originalData: Record<string, unknown>
  ): boolean {
    const changedData: Record<string, unknown> = {};
    for (const key in currentData) {
      if (Object.prototype.hasOwnProperty.call(currentData, key) && currentData[key] !== originalData[key]) {
        changedData[key] = currentData[key];
      }
    }

    if (Object.keys(changedData).length === 0) {
      this.toastService.error('No changes detected to update.');
      return false;
    }

    if (this.formValidation.validateRole(changedData)) {
      this.toastService.error('Please select a valid role before updating the record.');
      return false;
    }

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

    if (Object.prototype.hasOwnProperty.call(formData, 'password')) {
      const password = formData['password'] as string;
      if (!this.formValidation.validatePassword(password)) {
        this.toastService.error('Password must be at least 8 characters long.');
        return false;
      }
    }

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

  getModalTitle (mode: 'create' | 'update'): string {
    return mode === 'create' ? 'Add New Record' : 'Update Record';
  }

  getSubmitButtonText (mode: 'create' | 'update', hasChanges: boolean): string {
    if (mode === 'create') return 'Create Record';
    return hasChanges ? 'Update Record' : 'No Changes';
  }

  getSubmitButtonIcon (mode: 'create' | 'update'): string {
    return mode === 'create' ? 'add_circle' : 'save';
  }

  handleBooleanUpdate (table: TableMetadata, record: Record<string, unknown>, column: Column, newValue: boolean): void {
    if (!table || !record || column.type !== 'boolean') return;

    if (this.fieldAccess.isSensitiveField(column.name) && !this.fieldAccess.canModifyField(column.name)) {
      this.toastService.error('Only Global Administrators can modify user activation and email verification status.');
      return;
    }

    const recordId = record['id'] as number;
    const draftId = `${table.category}:${table.name}:${recordId}`;
    let existingDraft = this.draftService.getDraft(draftId);

    if (!existingDraft) {
      this.draftService.createDraft(
        {
          type: 'update',
          table: table.name,
          category: table.category,
          recordId: recordId
        },
        record
      );

      existingDraft = this.draftService.getDraft(draftId);
    }

    if (existingDraft) {
      const updatedData = { ...existingDraft.draftData, [column.name]: newValue };
      this.draftService.updateDraft(draftId, updatedData);
    }
  }

  isCurrentUser (id: number): boolean {
    const user = this.authService.getCurrentUser();
    return user ? String(user.id) === String(id) : false;
  }

  isRestrictedTable (table: TableMetadata | null): boolean {
    return table?.tableName === 'users';
  }

  canDeleteRecord (record: Record<string, unknown>, table: TableMetadata | null): boolean {
    if (!table) return false;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    if (table.tableName === 'users') {
      const recordId = record['id'] as number;
      if (this.isCurrentUser(recordId)) return false;
      return UserRoleHelper.isGlobalAdmin(currentUser.role);
    }

    return true;
  }
}
