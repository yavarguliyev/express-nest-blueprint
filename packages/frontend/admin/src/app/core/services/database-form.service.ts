import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { DatabaseDraftService } from './database-draft.service';
import { AuthService } from './auth.service';
import { UserRoleHelper } from '../enums/user-roles.enum';
import { TableMetadata, Column } from './database-operations.service';

@Injectable({
  providedIn: 'root',
})
export class DatabaseFormService {
  private toastService = inject(ToastService);
  private draftService = inject(DatabaseDraftService);
  private authService = inject(AuthService);

  hasFormChanges (currentData: Record<string, unknown>, originalData: Record<string, unknown>): boolean {
    for (const key in currentData) {
      if (currentData[key] !== originalData[key]) {
        return true;
      }
    }

    for (const key in originalData) {
      if (!(key in currentData)) {
        return true;
      }
    }

    return false;
  }

  isFieldChanged (fieldName: string, currentData: Record<string, unknown>, originalData: Record<string, unknown>): boolean {
    return currentData[fieldName] !== originalData[fieldName];
  }

  getChangedFields (currentData: Record<string, unknown>, originalData: Record<string, unknown>): Array<{ name: string; oldValue: unknown; newValue: unknown }> {
    const changes: Array<{ name: string; oldValue: unknown; newValue: unknown }> = [];

    for (const key in currentData) {
      if (
        Object.prototype.hasOwnProperty.call(currentData, key) &&
        currentData[key] !== originalData[key]
      ) {
        changes.push({
          name: key,
          oldValue: originalData[key],
          newValue: currentData[key],
        });
      }
    }

    return changes;
  }

  isRoleInvalid (formData: Record<string, unknown>): boolean {
    return (
      Object.prototype.hasOwnProperty.call(formData, 'role') &&
      (!formData['role'] || formData['role'] === '')
    );
  }

  isFormInvalid (formData: Record<string, unknown>, originalData: Record<string, unknown>): boolean {
    return this.isRoleInvalid(formData) || !this.hasFormChanges(formData, originalData);
  }

  getUpdateButtonText (formData: Record<string, unknown>, originalData: Record<string, unknown>): string {
    if (this.isRoleInvalid(formData)) {
      return 'Update Record';
    }
    if (!this.hasFormChanges(formData, originalData)) {
      return 'No Changes';
    }
    return 'Update Record';
  }

  getUpdateButtonTooltip (formData: Record<string, unknown>, originalData: Record<string, unknown>): string {
    if (this.isRoleInvalid(formData)) {
      return 'Please select a valid role before updating';
    }
    if (!this.hasFormChanges(formData, originalData)) {
      return 'Make changes to enable update';
    }
    return 'Save changes to record';
  }

  prepareFormData (table: TableMetadata, record: Record<string, unknown>, isFieldExcludedFromUpdate: (columnName: string) => boolean): Record<string, unknown> {
    const formData: Record<string, unknown> = {};
    table.columns.forEach((col) => {
      if (col.editable && !isFieldExcludedFromUpdate(col.name)) {
        formData[col.name] = record[col.name];
      }
    });
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
      if (
        Object.prototype.hasOwnProperty.call(currentData, key) &&
        currentData[key] !== originalData[key]
      ) {
        changedData[key] = currentData[key];
      }
    }

    if (Object.keys(changedData).length === 0) {
      this.toastService.error('No changes detected to update.');
      return false;
    }

    if (
      Object.prototype.hasOwnProperty.call(changedData, 'role') &&
      (!changedData['role'] || changedData['role'] === '')
    ) {
      this.toastService.error('Please select a valid role before updating the record.');
      return false;
    }

    const recordId = record['id'] as number;
    const draftId = `${table.category}:${table.name}:${recordId}`;

    this.draftService.updateDraft(draftId, currentData);

    return true;
  }

  handleBooleanUpdate (
    table: TableMetadata,
    record: Record<string, unknown>,
    column: Column,
    newValue: boolean,
    isSensitiveField: (columnName: string) => boolean,
    canModifySensitiveFields: () => boolean
  ): void {
    if (!table || !record || column.type !== 'boolean') return;

    if (isSensitiveField(column.name) && !canModifySensitiveFields()) {
      this.toastService.error(
        'Only Global Administrators can modify user activation and email verification status.',
      );
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
          recordId: recordId,
        },
        record,
      );
      existingDraft = this.draftService.getDraft(draftId);
    }

    if (existingDraft) {
      const updatedData = { ...existingDraft.draftData, [column.name]: newValue };
      this.draftService.updateDraft(draftId, updatedData);
    }
  }

  // Merged from database-validation.service.ts
  isCurrentUser (id: number): boolean {
    const user = this.authService.getCurrentUser();
    return user ? String(user.id) === String(id) : false;
  }

  isRestrictedTable (table: TableMetadata | null): boolean {
    return table?.tableName === 'users';
  }

  isFieldRestricted (_id: number, _colName: string): boolean {
    void _id;
    void _colName;
    return false;
  }

  isFieldExcludedFromUpdate (columnName: string, selectedRecord: Record<string, unknown> | null): boolean {
    const excludedFields = ['id', 'isActive', 'isEmailVerified', 'profileImageUrl'];

    const currentUser = this.authService.getCurrentUser();

    if (columnName === 'role' && currentUser) {
      if (!UserRoleHelper.canEditRoles(currentUser.role)) {
        excludedFields.push('role');
      } else if (selectedRecord && this.isCurrentUser(selectedRecord['id'] as number)) {
        excludedFields.push('role');
      }
    }

    return excludedFields.includes(columnName);
  }

  isFieldDisabled (columnName: string): boolean {
    const disabledFields = ['email'];
    return disabledFields.includes(columnName);
  }

  canDeleteRecord (record: Record<string, unknown>, table: TableMetadata | null): boolean {
    if (!table) return false;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    if (table.tableName === 'users') {
      const recordId = record['id'] as number;
      if (this.isCurrentUser(recordId)) {
        return false;
      }
      return UserRoleHelper.isGlobalAdmin(currentUser.role);
    }

    return true;
  }

  validateFormData (formData: Record<string, unknown>, columns: Array<{ name: string; required: boolean }>): string[] {
    const errors: string[] = [];

    for (const column of columns) {
      if (column.required) {
        const value = formData[column.name];
        if (value === null || value === undefined || value === '') {
          errors.push(`${column.name} is required`);
        }
      }
    }

    return errors;
  }
}