import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { DatabaseDraftService } from './database-draft.service';
import { AuthService } from './auth.service';
import { RoleAccessService } from './role-access.service';
import { TableMetadata, Column } from './database-operations.service';
import { FormValidationUtil } from '../utils/form-validation.util';

@Injectable({
  providedIn: 'root',
})
export class DatabaseFormService {
  private toastService = inject(ToastService);
  private draftService = inject(DatabaseDraftService);
  private authService = inject(AuthService);
  private roleAccess = inject(RoleAccessService);

  hasFormChanges (
    currentData: Record<string, unknown>,
    originalData: Record<string, unknown>,
  ): boolean {
    return FormValidationUtil.hasChanges(currentData, originalData);
  }

  isFieldChanged (
    fieldName: string,
    currentData: Record<string, unknown>,
    originalData: Record<string, unknown>,
  ): boolean {
    return FormValidationUtil.isFieldChanged(fieldName, currentData, originalData);
  }

  getChangedFields (
    currentData: Record<string, unknown>,
    originalData: Record<string, unknown>,
  ): Array<{ name: string; oldValue: unknown; newValue: unknown }> {
    return FormValidationUtil.getChangedFields(currentData, originalData);
  }

  isRoleInvalid (formData: Record<string, unknown>): boolean {
    return FormValidationUtil.hasRole(formData) && !FormValidationUtil.isRoleValid(formData);
  }

  isFormInvalid (formData: Record<string, unknown>, originalData: Record<string, unknown>): boolean {
    return this.isRoleInvalid(formData) || !this.hasFormChanges(formData, originalData);
  }

  getUpdateButtonText (
    formData: Record<string, unknown>,
    originalData: Record<string, unknown>,
  ): string {
    if (this.isRoleInvalid(formData)) {
      return 'Update Record';
    }
    if (!this.hasFormChanges(formData, originalData)) {
      return 'No Changes';
    }
    return 'Update Record';
  }

  getUpdateButtonTooltip (
    formData: Record<string, unknown>,
    originalData: Record<string, unknown>,
  ): string {
    if (this.isRoleInvalid(formData)) return 'Please select a valid role before updating';
    if (!this.hasFormChanges(formData, originalData)) return 'Make changes to enable update';
    return 'Save changes to record';
  }

  prepareFormData (
    table: TableMetadata,
    record: Record<string, unknown>,
    isFieldExcludedFromUpdate: (columnName: string) => boolean,
  ): Record<string, unknown> {
    const formData: Record<string, unknown> = {};
    table.columns.forEach((col) => {
      if (col.editable && !isFieldExcludedFromUpdate(col.name)) {
        formData[col.name] = record[col.name];
      }
    });
    return formData;
  }

  prepareCreateFormData (table: TableMetadata): Record<string, unknown> {
    const formData: Record<string, unknown> = {};
    table.columns.forEach((col) => {
      if (col.editable && !this.isFieldExcludedFromUpdate(col.name, null)) {
        formData[col.name] = col.type === 'boolean' ? false : '';
      }
    });

    const hasEmail = table.columns.some((c) => c.name === 'email');
    const hasPassword = table.columns.some((c) => c.name === 'password');

    if (hasEmail && !hasPassword) formData['password'] = '';

    return formData;
  }

  validateAndSubmitUpdate (
    table: TableMetadata,
    record: Record<string, unknown>,
    currentData: Record<string, unknown>,
    originalData: Record<string, unknown>,
  ): boolean {
    const changedData = FormValidationUtil.getChangedData(currentData, originalData);

    if (Object.keys(changedData).length === 0) {
      this.toastService.error('No changes detected to update.');
      return false;
    }

    if (!FormValidationUtil.isRoleValid(changedData)) {
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
          data: currentData,
        },
        record,
      );
    } else {
      this.draftService.updateDraft(draftId, currentData);
    }

    return true;
  }

  validateAndSubmitCreate (table: TableMetadata, formData: Record<string, unknown>): boolean {
    const editableColumns = table.columns.filter(
      (col) => col.editable && !this.isFieldExcludedFromUpdate(col.name, null),
    );

    const validationResult = FormValidationUtil.validateRequiredFields(
      formData,
      editableColumns.map((col) => ({ name: col.name, required: col.required })),
    );

    if (!validationResult.valid) {
      this.toastService.error(
        `Please fix the following errors: ${validationResult.errors?.join(', ')}`,
      );
      return false;
    }

    if (!FormValidationUtil.isRoleValid(formData)) {
      this.toastService.error('Please select a valid role before creating the record.');
      return false;
    }

    if (FormValidationUtil.hasPassword(formData)) {
      const passwordValidation = FormValidationUtil.validatePassword(
        formData['password'] as string,
      );
      if (!passwordValidation.valid) {
        this.toastService.error(passwordValidation.error || 'Invalid password');
        return false;
      }
    }

    this.draftService.createDraft(
      {
        type: 'create',
        table: table.name,
        category: table.category,
        data: formData,
      },
      null,
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

  generateRandomPassword (): string {
    return FormValidationUtil.generateRandomPassword();
  }

  handleBooleanUpdate (
    table: TableMetadata,
    record: Record<string, unknown>,
    column: Column,
    newValue: boolean,
    isSensitiveField: (columnName: string) => boolean,
    canModifySensitiveFields: () => boolean,
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

  isFieldExcludedFromUpdate (
    columnName: string,
    selectedRecord?: Record<string, unknown> | null,
  ): boolean {
    const excludedFields = ['id', 'profileImageUrl', 'createdAt', 'updatedAt', 'lastLogin'];

    const currentUser = this.authService.getCurrentUser();

    if (columnName === 'role' && currentUser) {
      if (!this.roleAccess.canEditRoles()) {
        excludedFields.push('role');
      } else if (selectedRecord && this.isCurrentUser(selectedRecord['id'] as number)) {
        excludedFields.push('role');
      }
    }

    return excludedFields.includes(columnName);
  }

  isFieldDisabled (
    columnName: string,
    table: TableMetadata | null,
    mode: 'create' | 'update' = 'update',
  ): boolean {
    if (
      mode === 'create' &&
      columnName === 'email' &&
      table?.columns.some((c) => c.name === 'email')
    ) {
      return false;
    }

    const disabledFields = ['id', 'email', 'createdAt', 'updatedAt', 'lastLogin'];
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
      return this.roleAccess.isGlobalAdmin();
    }

    return true;
  }
}
