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
import { DatabaseOperationsService } from '../../core/services/database-operations.service';
import {
  TableMetadata,
  Schema,
  Column,
  DatabaseOperation,
} from '../../core/services/database-operations.service';
import { DatabaseHelperService } from '../../core/services/database-helper.service';
import { DatabaseFormService } from '../../core/services/database-form.service';
import { ApiConfigService } from '../../core/services/api-config.service';
import { PaginationService } from '../../core/services/pagination.service';
import { ApiResponse, PaginatedResponse } from '../../core/interfaces/api-response.interface';
import { ToggleSwitch } from '../../shared/components/toggle-switch/toggle-switch';
import { ActionButtons } from '../../shared/components/action-buttons/action-buttons';
import {
  DraftStatusBar,
  DraftStatusConfig,
} from '../../shared/components/draft-status-bar/draft-status-bar';

import { DraggableResizableDirective } from '../../shared/directives/draggable-resizable.directive';

import { PasswordInput } from '../../shared/components/password-input/password-input';

@Component({
  selector: 'app-database',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToggleSwitch,
    ActionButtons,
    DraftStatusBar,
    DraggableResizableDirective,
    PasswordInput,
  ],
  templateUrl: './database.html',
  styleUrl: './database.css',
})
export class Database implements OnInit, AfterViewInit {
  @ViewChild('tableScrollContainer') tableScrollContainer!: ElementRef<HTMLDivElement>;

  private toastService = inject(ToastService);
  private dbOperations = inject(DatabaseOperationsService);
  private apiConfig = inject(ApiConfigService);
  private dbHelper = inject(DatabaseHelperService);
  private dbForm = inject(DatabaseFormService);
  private pagination = inject(PaginationService);
  private searchSubject = new Subject<string>();

  draftService = inject(DatabaseDraftService);
  useGraphQL = signal(false);
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
      this.dbHelper.setupScrollIndicators(this.tableScrollContainer.nativeElement);
    }
  }

  loadSchema (isRefresh = false): void {
    this.loadingSchema.set(true);
    this.dbOperations.loadSchema().subscribe({
      next: (res: ApiResponse<Schema>) => {
        if (isRefresh && !res.success) {
          this.toastService.error(res.message || 'Failed to refresh schema');
        } else {
          this.schema.set(res.data);
          if (isRefresh) this.toastService.success('Schema refreshed successfully');
        }

        this.loadingSchema.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load database schema.');
        this.loadingSchema.set(false);
      },
    });
  }

  refreshSchema (): void {
    this.loadSchema(true);
  }

  refreshTableData (): void {
    const table = this.selectedTable();
    if (!table) return;
    this.loadingData.set(true);

    this.dbOperations.loadTableData(table, this.page(), this.limit, this.searchQuery()).subscribe({
      next: (res: ApiResponse<PaginatedResponse<Record<string, unknown>>>) => {
        if (res.success) {
          const responseData = res.data;
          if (responseData?.data) {
            this.tableData.set(responseData.data);
            this.total.set(responseData.total || responseData.data.length);
            this.resetTableScroll();
          } else {
            this.tableData.set([]);
            this.total.set(0);
          }

          this.toastService.success('Table data refreshed successfully');
        } else {
          this.toastService.error(res.message || `Failed to refresh ${table.name} data.`);
        }

        this.loadingData.set(false);
      },
      error: () => {
        this.loadingData.set(false);
      },
    });
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
      next: (res: ApiResponse<PaginatedResponse<Record<string, unknown>>>) => {
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

  toggleGraphQL (): void {
    const newProtocol = this.useGraphQL() ? 'rest' : 'graphql';
    this.apiConfig.setProtocol(newProtocol);
    this.useGraphQL.set(!this.useGraphQL());
    this.toastService.info(`Switched to ${newProtocol.toUpperCase()} mode`);
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

  modalMode = signal<'create' | 'update'>('update');
  showPassword = signal(false);

  isCurrentUser (id: number): boolean {
    return this.dbForm.isCurrentUser(id);
  }

  isRestrictedTable (): boolean {
    return this.dbForm.isRestrictedTable(this.selectedTable());
  }

  isFieldExcluded (col: string): boolean {
    return this.dbForm.isFieldExcludedFromUpdate(col, this.selectedRecord());
  }

  isFieldDisabled (c: string): boolean {
    return this.dbForm.isFieldDisabled(c, this.selectedTable(), this.modalMode());
  }

  isFieldInMetadata (c: string): boolean {
    return this.selectedTable()?.columns.some((col) => col.name === c) ?? false;
  }

  generatePassword (): void {
    this.updateFormData.update((c) => ({ ...c, password: this.dbForm.generateRandomPassword() }));
  }

  canDeleteRecord (): boolean {
    return this.dbHelper.canDeleteRecord();
  }

  formatValue (v: unknown, c: Column): string {
    return this.dbHelper.formatValue(v, c);
  }

  getBooleanValue (r: Record<string, unknown>, c: string): boolean {
    return this.dbHelper.getBooleanValue(
      r,
      c,
      this.getRecordDraftData(this.dbHelper.getNumberValue(r, 'id')),
    );
  }

  getNumberValue (r: Record<string, unknown>, c: string): number {
    return this.dbHelper.getNumberValue(r, c);
  }

  getFieldDisplayName (f: string): string {
    return this.dbHelper.getFieldDisplayName(f);
  }

  getUserInitials (r: Record<string, unknown>): string {
    return this.dbHelper.getUserInitials(r);
  }

  isImageUrl (n: string): boolean {
    return this.dbHelper.isImageUrl(n);
  }

  getAvailableRoles (): { value: string; label: string }[] {
    return this.dbHelper.getAvailableRoles();
  }

  getHeaderClasses (n: string, t: string): string {
    return this.dbHelper.getHeaderClasses(n, t);
  }

  getCellClasses (n: string, t: string): string {
    return this.dbHelper.getCellClasses(n, t);
  }

  getColumnStyles (n: string, t: string): Record<string, string> {
    return this.dbHelper.getColumnStyles(n, t);
  }

  hasAnyActions (): boolean {
    return this.dbHelper.hasAnyActions(this.selectedTable());
  }

  canModifySensitiveFields (): boolean {
    return this.dbHelper.canModifySensitiveFields();
  }

  isSensitiveField (n: string): boolean {
    return this.dbHelper.isSensitiveField(n);
  }

  formatFieldValue (v: unknown): string {
    return this.dbHelper.formatFieldValue(v);
  }

  updateFormField (f: string, v: unknown): void {
    this.updateFormData.update((c) => ({ ...c, [f]: v }));
  }

  hasFormChanges (): boolean {
    return this.dbForm.hasFormChanges(this.updateFormData(), this.originalFormData());
  }

  isFieldChanged (f: string): boolean {
    return this.dbForm.isFieldChanged(f, this.updateFormData(), this.originalFormData());
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

  getModalTitle (): string {
    return this.dbForm.getModalTitle(this.modalMode());
  }

  getSubmitButtonText (): string {
    return this.dbForm.getSubmitButtonText(this.modalMode(), this.hasFormChanges());
  }

  getSubmitButtonIcon (): string {
    return this.dbForm.getSubmitButtonIcon(this.modalMode());
  }

  getUpdateButtonTooltip (): string {
    return this.dbForm.getUpdateButtonTooltip(this.updateFormData(), this.originalFormData());
  }

  createRecord (): void {
    const table = this.selectedTable();
    if (!table) return;
    const formData = this.dbForm.prepareCreateFormData(table);
    this.modalMode.set('create');
    this.updateFormData.set(formData);
    this.originalFormData.set({ ...formData });
    this.showUpdateModal.set(true);
  }

  updateRecord (id: number): void {
    const table = this.selectedTable();
    if (!table || !id) return;
    const record = this.tableData().find((row) => row['id'] === id);
    if (!record) return;
    const formData = this.dbForm.prepareFormData(table, record, (columnName) =>
      this.isFieldExcluded(columnName),
    );

    this.modalMode.set('update');
    this.selectedRecord.set(record);
    this.updateFormData.set(formData);
    this.originalFormData.set({ ...formData });
    this.showUpdateModal.set(true);
  }

  submitForm (): void {
    const table = this.selectedTable();
    if (!table) return;

    let success = false;

    if (this.modalMode() === 'create') {
      success = this.dbForm.validateAndSubmitCreate(table, this.updateFormData());
    } else {
      const record = this.selectedRecord();
      if (!record) return;
      success = this.dbForm.validateAndSubmitUpdate(
        table,
        record,
        this.updateFormData(),
        this.originalFormData(),
      );
    }

    if (success) this.closeUpdateModal();
  }

  deleteRecord (id: number): void {
    const table = this.selectedTable();
    if (!table || !id) return;

    this.dbOperations.confirmDelete(id, () => {
      const record = this.tableData().find((row) => row['id'] === id);
      if (!record) return;
      this.dbOperations.createDeleteDraft(table, id, record);
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
    if (this.apiConfig.isGraphQL()) {
      const allDrafts = Array.from(this.draftService.drafts().values()).filter(
        (draft) => draft.hasChanges,
      );

      if (allDrafts.length === 0) {
        this.toastService.info('No changes to publish');
        return;
      }

      this.isPublishing.set(true);

      const operations: DatabaseOperation[] = allDrafts.map((draft) => {
        const operation: DatabaseOperation = {
          type: draft.operation,
          table: draft.tableName,
          category: draft.category,
        };

        if (draft.recordId !== 'new') operation.recordId = draft.recordId;
        if (draft.operation !== 'delete') operation.data = draft.draftData;
        return operation;
      });

      this.dbOperations.bulkUpdate(operations, true).subscribe({
        next: (res: ApiResponse<unknown>) => {
          this.isPublishing.set(false);
          if (res.success) {
            this.draftService.resetDrafts();
            this.toastService.success('Successfully published changes via GraphQL');
            this.loadTableData(false);
          } else {
            this.toastService.error(res.message || 'Failed to publish changes via GraphQL');
          }
        },
        error: () => {
          this.isPublishing.set(false);
          this.toastService.error('Failed to publish changes via GraphQL');
        },
      });
    } else {
      this.dbHelper.publishAllChanges(
        this.hasDrafts(),
        (value) => this.isPublishing.set(value),
        () => this.loadTableData(false),
      );
    }
  }

  resetAllChanges (): void {
    this.dbHelper.resetAllChanges(this.hasDrafts(), this.draftCount(), () =>
      this.loadTableData(false),
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
    this.dbHelper.handleImageClick(imageUrl);
  }

  private resetTableScroll (): void {
    setTimeout(() => {
      if (this.tableScrollContainer) {
        this.tableScrollContainer.nativeElement.scrollLeft = 0;
      }
    }, 100);
  }
}
