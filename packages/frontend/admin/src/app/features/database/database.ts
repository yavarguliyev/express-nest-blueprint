import { Component, inject, OnInit, signal, ElementRef, ViewChild, AfterViewInit, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ToastService } from '../../core/services/ui/toast.service';
import { DatabaseDraftService } from '../../core/services/database/database-draft.service';
import { DatabasePublishService } from '../../core/services/database/database-publish.service';
import { DatabaseModalService } from '../../core/services/database/database-modal.service';
import { DatabaseRecordService } from '../../core/services/database/database-record.service';
import { DatabaseTableService } from '../../core/services/database/database-table.service';
import { Column, TableMetadata } from '../../core/interfaces/database.interface';
import { PasswordUtilityService } from '../../core/services/utilities/password-utility.service';
import { DatabaseComponentHelper } from './database-component.helper';
import { ToggleSwitch } from '../../shared/components/toggle-switch/toggle-switch';
import { ActionButtons } from '../../shared/components/action-buttons/action-buttons';
import { DraftStatusBar } from '../../shared/components/draft-status-bar/draft-status-bar';
import { DraftStatusConfig } from '../../core/interfaces/theme.interface';
import { DraggableResizableDirective } from '../../shared/directives/draggable-resizable.directive';
import { PasswordInput } from '../../shared/components/password-input/password-input';

@Component({
  selector: 'app-database',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleSwitch, ActionButtons, DraftStatusBar, DraggableResizableDirective, PasswordInput],
  templateUrl: './database.html',
  styleUrl: './database.css'
})
export class Database implements OnInit, AfterViewInit {
  @ViewChild('tableScrollContainer') tableScrollContainer!: ElementRef<HTMLDivElement>;

  private toastService = inject(ToastService);
  private passwordUtility = inject(PasswordUtilityService);
  private dbPublish = inject(DatabasePublishService);

  readonly helper = new DatabaseComponentHelper();
  readonly draftService = inject(DatabaseDraftService);
  readonly modalService = inject(DatabaseModalService);
  readonly recordService = inject(DatabaseRecordService);
  readonly tableService = inject(DatabaseTableService);
  readonly isPublishing = signal(false);
  readonly Math = Math;

  readonly useGraphQL = this.tableService.useGraphQL;
  readonly schema = this.tableService.schema;
  readonly loadingSchema = this.tableService.loadingSchema;
  readonly loadingData = this.tableService.loadingData;
  readonly expandedCategories = this.tableService.expandedCategories;
  readonly selectedTable = this.tableService.selectedTable;
  readonly tableData = this.tableService.tableData;
  readonly total = this.tableService.total;
  readonly page = this.tableService.page;
  readonly searchQuery = this.tableService.searchQuery;
  readonly showUpdateModal = this.modalService.showUpdateModal;
  readonly modalMode = this.modalService.modalMode;
  readonly selectedRecord = this.modalService.selectedRecord;
  readonly updateFormData = this.modalService.updateFormData;
  readonly originalFormData = this.modalService.originalFormData;
  readonly showPassword = this.modalService.showPassword;

  readonly draftStatusConfig = computed<DraftStatusConfig>(() => ({
    draftCount: this.draftService.draftCount(),
    hasDrafts: this.draftService.hasDrafts(),
    affectedItems: this.draftService.affectedTables(),
    isProcessing: this.isPublishing(),
    itemType: 'table',
    resetButtonText: 'Reset All',
    saveButtonText: 'Save Changes',
    resetButtonIcon: 'refresh',
    saveButtonIcon: 'save'
  }));

  refreshSchema = (): void => this.tableService.loadSchema(true);
  onGraphQLToggle = (useGraphQL: boolean): void => this.tableService.onGraphQLToggle(useGraphQL);
  refreshTableData = (): void => this.tableService.refreshTableData();
  toggleCategory = (category: string): void => this.tableService.toggleCategory(category);
  selectTable = (table: TableMetadata): void => this.tableService.selectTable(table);
  onSearch = (event: Event): void => this.tableService.onSearch(event);
  changePage = (newPage: number): void => this.tableService.changePage(newPage);
  isCurrentUser = (id: number): boolean => this.helper.isCurrentUser(id);
  isRestrictedTable = (): boolean => this.helper.isRestrictedTable(this.selectedTable());
  isFieldExcluded = (col: string): boolean => this.helper.isFieldExcluded(col, this.selectedRecord());
  isFieldDisabled = (c: string): boolean => this.helper.isFieldDisabled(c, this.selectedTable(), this.modalMode());
  isFieldInMetadata = (c: string): boolean => this.helper.isFieldInMetadata(c, this.selectedTable());
  canDeleteRecord = (): boolean => this.helper.canDeleteRecord();
  formatValue = (v: unknown, c: Column): string => this.helper.formatValue(v, c);
  getNumberValue = (r: Record<string, unknown>, c: string): number => this.helper.getNumberValue(r, c);
  getFieldDisplayName = (f: string): string => this.helper.getFieldDisplayName(f);
  getUserInitials = (r: Record<string, unknown>): string => this.helper.getUserInitials(r);
  isImageUrl = (n: string): boolean => this.helper.isImageUrl(n);
  getAvailableRoles = (): { value: string; label: string }[] => this.helper.getAvailableRoles();
  getHeaderClasses = (n: string, t: string): string => this.helper.getHeaderClasses(n, t);
  getCellClasses = (n: string, t: string): string => this.helper.getCellClasses(n, t);
  getColumnStyles = (n: string, t: string): Record<string, string> => this.helper.getColumnStyles(n, t);
  hasAnyActions = (): boolean => this.helper.hasAnyActions(this.selectedTable());
  canModifySensitiveFields = (): boolean => this.helper.canModifySensitiveFields();
  isSensitiveField = (n: string): boolean => this.helper.isSensitiveField(n);
  formatFieldValue = (v: unknown): string => this.helper.formatFieldValue(v);
  hasFormChanges = (): boolean => this.helper.hasFormChanges(this.updateFormData(), this.originalFormData());
  isRoleInvalid = (): boolean => this.helper.isRoleInvalid(this.updateFormData());
  getModalTitle = (): string => this.helper.getModalTitle(this.modalMode());
  getSubmitButtonText = (): string => this.helper.getSubmitButtonText(this.modalMode(), this.hasFormChanges());
  getSubmitButtonIcon = (): string => this.helper.getSubmitButtonIcon(this.modalMode());
  isFormInvalid = (): boolean => !this.hasFormChanges();

  get totalPages (): number {
    return this.tableService.totalPages();
  }

  get pages (): number[] {
    return this.tableService.pages();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey (event: KeyboardEvent): void {
    if (this.modalService.showUpdateModal()) {
      this.modalService.closeModal();
      event.preventDefault();
    }
  }

  ngOnInit (): void {
    if (window.location.pathname.includes('/database')) this.tableService.loadSchema();
  }

  ngAfterViewInit (): void {
    this.tableService.setupScrollIndicators(this.tableScrollContainer);
  }

  createRecord (): void {
    const table = this.selectedTable();
    if (table) this.modalService.openCreateModal(table);
  }

  updateRecord (id: number): void {
    const table = this.selectedTable();
    const record = this.tableData().find(row => row['id'] === id);
    if (table && record) this.modalService.openUpdateModal(table, record);
  }

  submitForm = (): void => {
    const table = this.selectedTable();
    if (table) this.modalService.submitForm(table);
  };

  generatePassword = (): void => {
    this.updateFormData.update(c => ({ ...c, password: this.passwordUtility.generatePassword() }));
  };

  updateFormField = (f: string, v: unknown): void => this.modalService.updateFormField(f, v);
  isFieldChanged = (f: string): boolean => this.modalService.isFieldChanged(f);
  closeUpdateModal = (): void => this.modalService.closeModal();

  deleteRecord (id: number): void {
    const table = this.selectedTable();
    if (table) this.recordService.deleteRecord(table, id, this.tableData());
  }

  updateBooleanValue (record: Record<string, unknown>, column: Column, newValue: boolean): void {
    const table = this.selectedTable();
    if (table) this.recordService.updateBooleanValue(table, record, column, newValue);
  }

  hasRecordDraft = (recordId: number): boolean => {
    const table = this.selectedTable();
    return table ? this.recordService.hasRecordDraft(table, recordId) : false;
  };

  getRecordDraftData = (recordId: number): Record<string, unknown> | null => {
    const table = this.selectedTable();
    return table ? this.recordService.getRecordDraftData(table, recordId) : null;
  };

  isRecordMarkedForDeletion = (recordId: number): boolean => {
    const table = this.selectedTable();
    return table ? this.recordService.isRecordMarkedForDeletion(table, recordId) : false;
  };

  getBooleanValue (r: Record<string, unknown>, c: string): boolean {
    const table = this.selectedTable();
    return table ? this.recordService.getBooleanValue(r, c, table, (rec, col) => this.helper.getNumberValue(rec, col)) : (r[c] as boolean);
  }

  publishAllChanges (): void {
    this.dbPublish.publishAllChanges(
      this.draftService.hasDrafts(),
      value => this.isPublishing.set(value),
      () => this.tableService.loadTableData(() => this.tableService.resetTableScroll(this.tableScrollContainer))
    );
  }

  resetAllChanges (): void {
    this.dbPublish.resetAllChanges(this.draftService.hasDrafts(), this.draftService.draftCount(), () =>
      this.tableService.loadTableData(() => this.tableService.resetTableScroll(this.tableScrollContainer))
    );
  }

  handleImageClick (row: Record<string, unknown>, columnName: string): void {
    const imageUrl = row[columnName] as string;
    if (imageUrl?.trim()) window.open(imageUrl, '_blank');
    else this.toastService.info('No image available.');
  }

  getChangedFields (): Array<{ name: string; oldValue: unknown; newValue: unknown }> {
    return this.helper.getChangedFields(this.updateFormData(), this.originalFormData());
  }

  getUpdateButtonTooltip (): string {
    const hasChanges = this.hasFormChanges();
    return this.helper.getUpdateButtonTooltip(hasChanges, hasChanges ? this.getChangedFields().length : 0);
  }
}
