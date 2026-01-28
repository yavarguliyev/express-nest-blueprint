import {
  Component,
  inject,
  OnInit,
  signal,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { DatabaseDraftService } from '../../core/services/database-draft.service';
import {
  DatabaseOperationsService,
  TableMetadata,
  Schema,
  Column,
} from '../../core/services/database-operations.service';
import { DatabaseValidationService } from '../../core/services/database-validation.service';
import { DatabaseHelperService } from '../../core/services/database-helper.service';
import { DatabaseFormService } from '../../core/services/database-form.service';
import { DatabaseCrudService } from '../../core/services/database-crud.service';
import { PaginationService } from '../../core/services/pagination.service';
import { ToggleSwitch } from '../../shared/components/toggle-switch/toggle-switch';
import { ActionButtons } from '../../shared/components/action-buttons/action-buttons';
import {
  DraftStatusBar,
  DraftStatusConfig,
} from '../../shared/components/draft-status-bar/draft-status-bar';

@Component({
  selector: 'app-database',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleSwitch, ActionButtons, DraftStatusBar],
  templateUrl: './database.html',
  styleUrl: './database.css',
})
export class Database implements OnInit, AfterViewInit {
  private toastService = inject(ToastService);
  draftService = inject(DatabaseDraftService);
  private dbOperations = inject(DatabaseOperationsService);
  private dbValidation = inject(DatabaseValidationService);
  private dbHelper = inject(DatabaseHelperService);
  private dbForm = inject(DatabaseFormService);
  private dbCrud = inject(DatabaseCrudService);
  private pagination = inject(PaginationService);

  @ViewChild('tableScrollContainer') tableScrollContainer!: ElementRef<HTMLDivElement>;

  schema = signal<Schema | null>(null);
  loadingSchema = signal(true);
  loadingData = signal(false);
  expandedCategories = signal<{ [key: string]: boolean }>({});
  selectedTable = signal<TableMetadata | null>(null);
  tableData = signal<Record<string, unknown>[]>([]);
  total = signal(0);
  page = signal(1);
  limit = 10;
  searchQuery = signal('');
  private searchSubject = new Subject<string>();

  selectedRecord = signal<Record<string, unknown> | null>(null);
  showUpdateModal = signal(false);
  updateFormData = signal<Record<string, unknown>>({});
  originalFormData = signal<Record<string, unknown>>({});

  draftCount = this.draftService.draftCount;
  hasDrafts = this.draftService.hasDrafts;
  affectedTables = this.draftService.affectedTables;
  showBulkActions = signal(false);
  isPublishing = signal(false);

  draftStatusConfig = computed<DraftStatusConfig>(() => ({
    draftCount: this.draftCount(),
    hasDrafts: this.hasDrafts(),
    affectedItems: this.affectedTables(),
    isProcessing: this.isPublishing(),
    itemType: 'table',
    resetButtonText: 'Reset All',
    saveButtonText: 'Save Changes',
    resetButtonIcon: 'refresh',
    saveButtonIcon: 'save',
  }));

  Math = Math;

  constructor () {
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe((query) => {
      this.searchQuery.set(query);
      this.page.set(1);
      this.loadTableData();
    });
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey (event: KeyboardEvent): void {
    if (this.showUpdateModal()) {
      this.closeUpdateModal();
      event.preventDefault();
    }
  }

  ngOnInit (): void {
    if (window.location.pathname.includes('/database')) {
      this.loadSchema();
    }
  }

  ngAfterViewInit (): void {
    if (this.tableScrollContainer) {
      this.setupScrollIndicators();
    }
  }

  loadSchema (): void {
    if (this.schema()) return;
    this.loadingSchema.set(true);
    this.dbOperations.loadSchema().subscribe({
      next: (res) => {
        this.schema.set(res.data);
        this.loadingSchema.set(false);
        this.expandFirstCategory();
      },
      error: () => {
        this.toastService.error('Failed to load database schema.');
        this.loadingSchema.set(false);
      },
    });
  }

  private expandFirstCategory (): void {
    const categories = Object.keys(this.schema() || {});
    if (categories.length > 0 && categories[0]) {
      this.toggleCategory(categories[0]);
    }
  }

  toggleCategory (category: string): void {
    this.expandedCategories.update((prev) => ({ ...prev, [category]: !prev[category] }));
  }

  selectTable (table: TableMetadata): void {
    if (this.selectedTable()?.name === table.name) {
      this.selectedTable.set(null);
      this.tableData.set([]);
      return;
    }
    this.selectedTable.set(table);
    this.page.set(1);
    this.loadTableData();
  }

  loadTableData (resetScroll = true): void {
    const table = this.selectedTable();
    if (!table) return;
    this.loadingData.set(true);
    this.dbOperations.loadTableData(table, this.page(), this.limit, this.searchQuery()).subscribe({
      next: (res) => {
        const responseData = res.data;
        if (responseData?.data) {
          this.tableData.set(responseData.data);
          this.total.set(responseData.total || responseData.data.length);
          if (resetScroll) this.resetTableScroll();
        } else {
          this.tableData.set([]);
          this.total.set(0);
        }
        this.loadingData.set(false);
      },
      error: () => {
        this.toastService.error(`Failed to load ${table.name} data.`);
        this.loadingData.set(false);
      },
    });
  }

  private resetTableScroll (): void {
    setTimeout(() => {
      if (this.tableScrollContainer) {
        this.tableScrollContainer.nativeElement.scrollLeft = 0;
      }
    }, 100);
  }

  onSearch (event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  changePage (newPage: number): void {
    if (!this.pagination.isValidPageChange(newPage, this.totalPages)) return;
    this.page.set(newPage);
    this.loadTableData();
  }

  get totalPages (): number {
    return this.pagination.calculateTotalPages(this.total(), this.limit);
  }

  get pages (): number[] {
    return this.pagination.generatePageNumbers(this.page(), this.totalPages);
  }

  isCurrentUser (id: number): boolean {
    return this.dbValidation.isCurrentUser(id);
  }
  isRestrictedTable (): boolean {
    return this.dbValidation.isRestrictedTable(this.selectedTable());
  }
  isFieldExcludedFromUpdate (columnName: string): boolean {
    return this.dbValidation.isFieldExcludedFromUpdate(columnName, this.selectedRecord());
  }
  isFieldDisabled (columnName: string): boolean {
    return this.dbValidation.isFieldDisabled(columnName);
  }
  canDeleteRecord (): boolean {
    return this.dbHelper.canDeleteRecord();
  }

  formatValue (value: unknown, column: Column): string {
    return this.dbHelper.formatValue(value, column);
  }
  getBooleanValue (row: Record<string, unknown>, columnName: string): boolean {
    const recordId = this.dbHelper.getNumberValue(row, 'id');
    const draftData = this.getRecordDraftData(recordId);
    return this.dbHelper.getBooleanValue(row, columnName, draftData);
  }
  getNumberValue (row: Record<string, unknown>, columnName: string): number {
    return this.dbHelper.getNumberValue(row, columnName);
  }
  getFieldDisplayName (fieldName: string): string {
    return this.dbHelper.getFieldDisplayName(fieldName);
  }
  getUserInitials (row: Record<string, unknown>): string {
    return this.dbHelper.getUserInitials(row);
  }
  isImageUrl (colName: string): boolean {
    return this.dbHelper.isImageUrl(colName);
  }
  getAvailableRoles (): { value: string; label: string }[] {
    return this.dbHelper.getAvailableRoles();
  }
  getHeaderClasses (columnName: string, columnType: string): string {
    return this.dbHelper.getHeaderClasses(columnName, columnType);
  }
  getCellClasses (columnName: string, columnType: string): string {
    return this.dbHelper.getCellClasses(columnName, columnType);
  }
  getColumnStyles (columnName: string, columnType: string): Record<string, string> {
    return this.dbHelper.getColumnStyles(columnName, columnType);
  }
  hasAnyActions (): boolean {
    return this.dbHelper.hasAnyActions(this.selectedTable());
  }
  canModifySensitiveFields (): boolean {
    return this.dbHelper.canModifySensitiveFields();
  }
  isSensitiveField (columnName: string): boolean {
    return this.dbHelper.isSensitiveField(columnName);
  }
  formatFieldValue (value: unknown): string {
    return this.dbHelper.formatFieldValue(value);
  }

  updateFormField (fieldName: string, value: unknown): void {
    this.updateFormData.update((current) => ({ ...current, [fieldName]: value }));
  }
  hasFormChanges (): boolean {
    return this.dbForm.hasFormChanges(this.updateFormData(), this.originalFormData());
  }
  isFieldChanged (fieldName: string): boolean {
    return this.dbForm.isFieldChanged(fieldName, this.updateFormData(), this.originalFormData());
  }
  getChangedFields (): Array<{ name: string; oldValue: unknown; newValue: unknown }> {
    return this.dbForm.getChangedFields(this.updateFormData(), this.originalFormData());
  }
  isRoleInvalid (): boolean {
    return this.dbForm.isRoleInvalid(this.updateFormData());
  }
  isFormInvalid (): boolean {
    return this.dbForm.isFormInvalid(this.updateFormData(), this.originalFormData());
  }
  getUpdateButtonText (): string {
    return this.dbForm.getUpdateButtonText(this.updateFormData(), this.originalFormData());
  }
  getUpdateButtonTooltip (): string {
    return this.dbForm.getUpdateButtonTooltip(this.updateFormData(), this.originalFormData());
  }

  updateRecord (id: number): void {
    const table = this.selectedTable();
    if (!table || !id) return;
    const record = this.tableData().find((row) => row['id'] === id);
    if (!record) return;
    const formData = this.dbForm.prepareFormData(table, record, (columnName) =>
      this.isFieldExcludedFromUpdate(columnName),
    );
    this.dbCrud.createUpdateDraft(table, record, formData);
    this.selectedRecord.set(record);
    this.updateFormData.set(formData);
    this.originalFormData.set({ ...formData });
    this.showUpdateModal.set(true);
  }

  submitUpdate (): void {
    const table = this.selectedTable();
    const record = this.selectedRecord();
    if (!table || !record) return;
    const success = this.dbForm.validateAndSubmitUpdate(
      table,
      record,
      this.updateFormData(),
      this.originalFormData(),
    );
    if (success) this.closeUpdateModal();
  }

  deleteRecord (id: number): void {
    const table = this.selectedTable();
    if (!table || !id) return;
    this.dbCrud.confirmDelete(id, () => {
      const record = this.tableData().find((row) => row['id'] === id);
      if (!record) return;
      this.dbCrud.createDeleteDraft(table, id, record);
    });
  }

  updateBooleanValue (record: Record<string, unknown>, column: Column, newValue: boolean): void {
    const table = this.selectedTable();
    this.dbForm.handleBooleanUpdate(
      table!,
      record,
      column,
      newValue,
      (columnName) => this.isSensitiveField(columnName),
      () => this.canModifySensitiveFields(),
    );
  }

  hasRecordDraft (recordId: number): boolean {
    const table = this.selectedTable();
    if (!table) return false;
    const draftId = `${table.category}:${table.name}:${recordId}`;
    return this.draftService.hasDraftChanges(draftId);
  }

  getRecordDraftData (recordId: number): Record<string, unknown> | null {
    const table = this.selectedTable();
    if (!table) return null;
    const draft = this.draftService.getDraftForRecord(table.category, table.name, recordId);
    return draft ? draft.draftData : null;
  }

  isRecordMarkedForDeletion (recordId: number): boolean {
    const table = this.selectedTable();
    if (!table) return false;
    const draft = this.draftService.getDraftForRecord(table.category, table.name, recordId);
    return draft?.operation === 'delete';
  }

  publishAllChanges (): void {
    if (!this.hasDrafts()) {
      this.toastService.info('No changes to publish');
      return;
    }
    this.isPublishing.set(true);
    this.draftService.publishDrafts().subscribe({
      next: (response) => {
        this.isPublishing.set(false);
        if (response.success) {
          this.toastService.success(
            `Successfully published ${response.summary.successful} changes`,
          );
          this.loadTableData(false);
        } else {
          this.toastService.error(
            `Published ${response.summary.successful} changes, ${response.summary.failed} failed`,
          );
        }
      },
      error: () => {
        this.isPublishing.set(false);
        this.toastService.error('Failed to publish changes');
      },
    });
  }

  resetAllChanges (): void {
    if (!this.hasDrafts()) {
      this.toastService.info('No changes to reset');
      return;
    }
    this.toastService.confirm(
      `Reset all ${this.draftCount()} unsaved changes? This cannot be undone.`,
      () => {
        this.draftService.resetDrafts();
        this.loadTableData(false);
        this.toastService.success('All changes have been reset');
      },
    );
  }

  closeUpdateModal (): void {
    this.showUpdateModal.set(false);
    this.selectedRecord.set(null);
    this.updateFormData.set({});
    this.originalFormData.set({});
  }

  handleImageClick (row: Record<string, unknown>, columnName: string): void {
    const imageUrl = row[columnName] as string;
    if (imageUrl?.trim()) {
      window.open(imageUrl, '_blank');
    } else {
      this.toastService.info('No image available.');
    }
  }

  private setupScrollIndicators (): void {
    const container = this.tableScrollContainer.nativeElement;
    const updateScrollIndicators = (): void => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      container.classList.remove('scrolled-left', 'scrolled-right');
      if (scrollLeft > 0) container.classList.add('scrolled-left');
      if (scrollLeft < scrollWidth - clientWidth - 1) container.classList.add('scrolled-right');
    };
    setTimeout(updateScrollIndicators, 100);
    container.addEventListener('scroll', updateScrollIndicators);
    window.addEventListener('resize', updateScrollIndicators);
  }
}
