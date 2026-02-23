import { Injectable, inject } from '@angular/core';

import { Column, TableMetadata } from '../../core/interfaces/database.interface';
import { DatabaseComponentHelper } from './database-component.helper';
import { DatabaseModalManagerService } from './database-modal-manager.service';
import { DatabaseRecordService } from '../../core/services/database/database-record.service';
import { DatabaseTableService } from '../../core/services/database/database-table.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseDelegationService {
  private helper = new DatabaseComponentHelper();
  private recordService = inject(DatabaseRecordService);
  private tableService = inject(DatabaseTableService);

  readonly modal = inject(DatabaseModalManagerService);

  getNumberValue = (r: Record<string, unknown>, c: string): number => this.helper.getNumberValue(r, c);
  getCellClasses = (n: string, t: string): string => this.helper.getCellClasses(n, t);
  getHeaderClasses = (n: string, t: string): string => this.helper.getHeaderClasses(n, t);
  getColumnStyles = (n: string, t: string): Record<string, string> => this.helper.getColumnStyles(n, t);
  formatValue = (v: unknown, c: Column): string => this.helper.formatValue(v, c);
  getFieldDisplayName = (f: string): string => this.helper.getFieldDisplayName(f);
  getUserInitials = (r: Record<string, unknown>): string => this.helper.getUserInitials(r);
  isImageUrl = (n: string): boolean => this.helper.isImageUrl(n);
  getAvailableRoles = (): { value: string; label: string }[] => this.helper.getAvailableRoles();
  hasAnyActions = (table: TableMetadata | null): boolean => this.helper.hasAnyActions(table);
  canModifySensitiveFields = (): boolean => this.helper.canModifySensitiveFields();
  isSensitiveField = (n: string): boolean => this.helper.isSensitiveField(n);
  formatFieldValue = (v: unknown): string => this.helper.formatFieldValue(v);
  isFieldExcluded = (col: string, record: Record<string, unknown> | null): boolean => this.helper.isFieldExcluded(col, record);
  isFieldDisabled = (c: string, table: TableMetadata | null, mode: 'create' | 'update'): boolean => this.helper.isFieldDisabled(c, table, mode);
  isFieldInMetadata = (c: string, table: TableMetadata | null): boolean => this.helper.isFieldInMetadata(c, table);
  canDeleteRecord = (): boolean => this.helper.canDeleteRecord();
  isRestrictedTable = (table: TableMetadata | null): boolean => this.helper.isRestrictedTable(table);
  hasFormChanges = (): boolean => this.helper.hasFormChanges(this.modal.updateFormData(), this.modal.originalFormData());
  isRoleInvalid = (): boolean => this.helper.isRoleInvalid(this.modal.updateFormData());
  getModalTitle = (): string => this.helper.getModalTitle(this.modal.modalMode());
  getSubmitButtonText = (hasChanges: boolean): string => this.helper.getSubmitButtonText(this.modal.modalMode(), hasChanges);
  getSubmitButtonIcon = (): string => this.helper.getSubmitButtonIcon(this.modal.modalMode());
  isFormInvalid = (hasChanges: boolean): boolean => !hasChanges || this.isRoleInvalid();
  hasRecordDraft = (table: TableMetadata | null, id: number): boolean => (table ? this.recordService.hasRecordDraft({ table, recordId: id }) : false);
  changePage = (p: number): void => this.tableService.changePage(p);
  refreshSchema = (): void => this.tableService.loadSchema(true);
  onGraphQLToggle = (enabled: boolean): void => this.tableService.onGraphQLToggle(enabled);
  refreshTableData = (): void => this.tableService.refreshTableData();
  toggleCategory = (category: string): void => this.tableService.toggleCategory(category);
  selectTable = (table: TableMetadata): void => this.tableService.selectTable(table);
  onSearch = (event: Event): void => this.tableService.onSearch(event);
  getNumberValueWrapper = (r: Record<string, unknown>, c: string): number => this.getNumberValue(r, c);
  getCellClassesWrapper = (n: string, t: string): string => this.getCellClasses(n, t);
  getHeaderClassesWrapper = (n: string, t: string): string => this.getHeaderClasses(n, t);
  getColumnStylesWrapper = (n: string, t: string): Record<string, string> => this.getColumnStyles(n, t);
  formatValueWrapper = (v: unknown, c: Column): string => this.formatValue(v, c);
  getFieldDisplayNameWrapper = (f: string): string => this.getFieldDisplayName(f);
  getUserInitialsWrapper = (r: Record<string, unknown>): string => this.getUserInitials(r);
  isImageUrlWrapper = (n: string): boolean => this.isImageUrl(n);
  getAvailableRolesWrapper = (): { value: string; label: string }[] => this.getAvailableRoles();
  canModifySensitiveFieldsWrapper = (): boolean => this.canModifySensitiveFields();
  isSensitiveFieldWrapper = (n: string): boolean => this.isSensitiveField(n);
  formatFieldValueWrapper = (v: unknown): string => this.formatFieldValue(v);
  canDeleteRecordWrapper = (): boolean => this.canDeleteRecord();
  changePageWrapper = (p: number): void => this.changePage(p);
  refreshSchemaWrapper = (): void => this.refreshSchema();
  onGraphQLToggleWrapper = (enabled: boolean): void => this.onGraphQLToggle(enabled);
  refreshTableDataWrapper = (): void => this.refreshTableData();
  toggleCategoryWrapper = (category: string): void => this.toggleCategory(category);
  selectTableWrapper = (table: TableMetadata): void => this.selectTable(table);
  onSearchWrapper = (event: Event): void => this.onSearch(event);
  getSubmitButtonIconWrapper = (): string => this.getSubmitButtonIcon();
  showUpdateModalWrapper = (): boolean => this.modal.showUpdateModal();
  modalModeWrapper = (): 'create' | 'update' => this.modal.modalMode();
  updateFormDataWrapper = (): Record<string, unknown> => this.modal.updateFormData();
  updateFormFieldWrapper = (field: string, value: unknown): void => this.modal.updateFormField(field, value);
  isFieldChangedWrapper = (field: string): boolean => this.modal.isFieldChanged(field);
  closeUpdateModalWrapper = (): void => this.modal.closeModal();
  hasAnyActionsWrapper = (table: TableMetadata | null): boolean => this.hasAnyActions(table);
  isFieldExcludedWrapper = (c: string, record: Record<string, unknown> | null): boolean => this.isFieldExcluded(c, record);
  isFieldDisabledWrapper = (c: string, table: TableMetadata | null, mode: 'create' | 'update'): boolean => this.isFieldDisabled(c, table, mode);
  isFieldInMetadataWrapper = (c: string, table: TableMetadata | null): boolean => this.isFieldInMetadata(c, table);
  isRestrictedTableWrapper = (table: TableMetadata | null): boolean => this.isRestrictedTable(table);
  hasFormChangesWrapper = (): boolean => this.hasFormChanges();
  isRoleInvalidWrapper = (): boolean => this.isRoleInvalid();
  getModalTitleWrapper = (): string => this.getModalTitle();
  getSubmitButtonTextWrapper = (hasChanges: boolean): string => this.getSubmitButtonText(hasChanges);
  isFormInvalidWrapper = (hasChanges: boolean): boolean => this.isFormInvalid(hasChanges);
  getChangedFieldsWrapper = (): Array<{ name: string; oldValue: unknown; newValue: unknown }> => this.getChangedFields();
  hasRecordDraftWrapper = (table: TableMetadata | null, id: number): boolean => this.hasRecordDraft(table, id);
  getRecordDraftDataWrapper = (table: TableMetadata | null, id: number): Record<string, unknown> | null => this.getRecordDraftData(table, id);
  isRecordMarkedForDeletionWrapper = (table: TableMetadata | null, id: number): boolean => this.isRecordMarkedForDeletion(table, id);

  getChangedFields (): Array<{ name: string; oldValue: unknown; newValue: unknown }> {
    return this.helper.getChangedFields(this.modal.updateFormData(), this.modal.originalFormData());
  }

  getUpdateButtonTooltip (hasChanges: boolean, changedFieldsCount: number): string {
    return this.helper.getUpdateButtonTooltip(hasChanges, changedFieldsCount);
  }

  getRecordDraftData (table: TableMetadata | null, id: number): Record<string, unknown> | null {
    return table ? this.recordService.getRecordDraftData({ table, recordId: id }) : null;
  }

  isRecordMarkedForDeletion (table: TableMetadata | null, id: number): boolean {
    return table ? this.recordService.isRecordMarkedForDeletion({ table, recordId: id }) : false;
  }

  getUpdateButtonTooltipWrapper (hasChanges: boolean, changedFieldsCount: number): string {
    return this.getUpdateButtonTooltip(hasChanges, changedFieldsCount);
  }
}
