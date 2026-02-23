import { inject } from '@angular/core';

import { FormatterService } from '../../core/services/utilities/formatter.service';
import { UserUtilityService } from '../../core/services/utilities/user-utility.service';
import { FieldAccessService } from '../../core/services/validation/field-access.service';
import { TextTransformService } from '../../core/services/utilities/text-transform.service';
import { TableStyleService } from '../../core/services/styling/table-style.service';
import { DatabaseFormService } from '../../core/services/database/database-form.service';
import { FormValidationService } from '../../core/services/validation/form-validation.service';
import { Column, TableMetadata } from '../../core/interfaces/database.interface';
import { ROLE_OPTIONS } from '../../core/constants/role.constants';

export class DatabaseComponentHelper {
  private formatter = inject(FormatterService);
  private userUtility = inject(UserUtilityService);
  private fieldAccess = inject(FieldAccessService);
  private textTransform = inject(TextTransformService);
  private tableStyle = inject(TableStyleService);
  private dbForm = inject(DatabaseFormService);
  private formValidation = inject(FormValidationService);

  formatValue (v: unknown, c: Column): string {
    return this.formatter.formatValue(v, c);
  }

  formatFieldValue (v: unknown): string {
    return this.formatter.formatFieldValue(v);
  }

  getFieldDisplayName (f: string): string {
    return this.textTransform.getDisplayName(f);
  }

  getUserInitials (r: Record<string, unknown>): string {
    return this.userUtility.getUserInitials(r as { firstName?: string; lastName?: string; email?: string });
  }

  canDeleteRecord (): boolean {
    return this.userUtility.canDeleteRecord();
  }

  canModifySensitiveFields (): boolean {
    return this.userUtility.canModifySensitiveFields();
  }

  isCurrentUser (id: number): boolean {
    return this.dbForm.isCurrentUser(id);
  }

  isFieldExcluded (col: string, selectedRecord: Record<string, unknown> | null): boolean {
    return this.fieldAccess.isFieldExcludedFromUpdate(col, selectedRecord);
  }

  isFieldDisabled (c: string, table: TableMetadata | null, mode: 'create' | 'update'): boolean {
    return this.fieldAccess.isFieldDisabled(c, table, mode);
  }

  isSensitiveField (n: string): boolean {
    return this.fieldAccess.isSensitiveField(n);
  }

  getHeaderClasses (n: string, t: string): string {
    return this.tableStyle.getHeaderClasses(n, t);
  }

  getCellClasses (n: string, t: string): string {
    return this.tableStyle.getCellClasses(n, t);
  }

  getColumnStyles (n: string, t: string): Record<string, string> {
    return this.tableStyle.getColumnStyles(n, t);
  }

  getModalTitle (mode: 'create' | 'update'): string {
    return this.dbForm.getModalTitle(mode);
  }

  getSubmitButtonText (mode: 'create' | 'update', hasChanges: boolean): string {
    return this.dbForm.getSubmitButtonText({ mode, hasChanges });
  }

  getSubmitButtonIcon (mode: 'create' | 'update'): string {
    return this.dbForm.getSubmitButtonIcon(mode);
  }

  isRestrictedTable (table: TableMetadata | null): boolean {
    return this.dbForm.isRestrictedTable(table);
  }

  hasFormChanges (currentData: Record<string, unknown>, originalData: Record<string, unknown>): boolean {
    return this.formValidation.hasFormChanges(currentData, originalData);
  }

  getChangedFields (
    currentData: Record<string, unknown>,
    originalData: Record<string, unknown>
  ): Array<{ name: string; oldValue: unknown; newValue: unknown }> {
    return this.formValidation.getChangedFields(currentData, originalData);
  }

  isRoleInvalid (formData: Record<string, unknown>): boolean {
    return this.formValidation.validateRole(formData);
  }

  isImageUrl (n: string): boolean {
    return n.toLowerCase().includes('image') || n.toLowerCase().includes('avatar');
  }

  getAvailableRoles (): { value: string; label: string }[] {
    return [...ROLE_OPTIONS];
  }

  getNumberValue (r: Record<string, unknown>, c: string): number {
    return r[c] as number;
  }

  isFieldInMetadata (c: string, table: TableMetadata | null): boolean {
    return table?.columns.some(col => col.name === c) ?? false;
  }

  hasAnyActions (table: TableMetadata | null): boolean {
    if (!table) return false;
    const actions = table.actions || { create: true, update: true, delete: true };
    return actions.update !== false || actions.delete !== false;
  }

  getUpdateButtonTooltip (hasChanges: boolean, changedFieldsCount: number): string {
    if (!hasChanges) return 'No changes to save';
    return `${changedFieldsCount} field(s) modified`;
  }
}
