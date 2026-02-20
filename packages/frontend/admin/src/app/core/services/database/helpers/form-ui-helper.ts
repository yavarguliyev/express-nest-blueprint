import { Injectable, inject } from '@angular/core';

import { ToastService } from '../../ui/toast.service';
import { DatabaseDraftService } from '../database-draft.service';
import { AuthService } from '../../auth/auth.service';
import { FieldAccessService } from '../../validation/field-access.service';
import { UserRoleHelper } from '../../utilities/user-role-utility.service';
import { TableMetadata, Column } from '../../../interfaces/database.interface';

@Injectable({
  providedIn: 'root'
})
export class FormUIHelper {
  private toastService = inject(ToastService);
  private draftService = inject(DatabaseDraftService);
  private authService = inject(AuthService);
  private fieldAccess = inject(FieldAccessService);

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

    this.updateBooleanDraft(table, record, column.name, newValue);
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

  private updateBooleanDraft (table: TableMetadata, record: Record<string, unknown>, columnName: string, newValue: boolean): void {
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
      const updatedData = { ...existingDraft.draftData, [columnName]: newValue };
      this.draftService.updateDraft(draftId, updatedData);
    }
  }
}
