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
import { ToastService, ApiResponse, PaginatedResponse } from '@app/common';

import { ToggleSwitch } from '../../shared/components/toggle-switch/toggle-switch.component';
import { DraggableResizableDirective } from '../../shared/directives/draggable-resizable.directive';
import { PasswordInput } from '../../shared/components/password-input/password-input.component';
import { DatabaseFacade } from './database.facade';
import { TableMetadata, Schema, Column } from '../../core/interfaces/database.interface';
import { DatabaseOperation } from '../../core/interfaces/database-bulk.interface';
import { ActionButtons } from '../../shared/components/action-buttons/action-buttons';
import { DraftStatusBar } from '../../shared/components/draft-status-bar/draft-status-bar';
import { DraftStatusConfig } from '../../core/interfaces/token.interface';

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
  private facade = inject(DatabaseFacade);
  private searchSubject = new Subject<string>();

  draftService = this.facade.getDraftService();
  draftCount = this.facade.draftCount;
  hasDrafts = this.facade.hasDrafts;
  affectedTables = this.facade.affectedTables;

  limit = 10;

  useGraphQL = signal(false);
  schema = signal<Schema | null>(null);
  loadingSchema = signal(true);
  loadingData = signal(false);
  expandedCategories = signal<{ [key: string]: boolean }>({});
  selectedTable = signal<TableMetadata | null>(null);
  tableData = signal<Record<string, unknown>[]>([]);
  total = signal(0);
  page = signal(1);
  searchQuery = signal('');
  selectedRecord = signal<Record<string, unknown> | null>(null);
  showUpdateModal = signal(false);
  updateFormData = signal<Record<string, unknown>>({});
  originalFormData = signal<Record<string, unknown>>({});
  showBulkActions = signal(false);
  isPublishing = signal(false);
  modalMode = signal<'create' | 'update'>('update');
  showPassword = signal(false);

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

  get totalPages (): number {
    return this.facade.calculateTotalPages(this.total(), this.limit);
  }

  get pages (): number[] {
    return this.facade.generatePageNumbers(this.page(), this.totalPages);
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
      this.facade.setupScrollIndicators(this.tableScrollContainer.nativeElement);
    }
  }

  loadSchema (isRefresh = false): void {
    this.loadingSchema.set(true);
    this.facade.loadSchema().subscribe({
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

    this.facade.loadTableData(table, this.page(), this.limit, this.searchQuery()).subscribe({
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

    this.facade.loadTableData(table, this.page(), this.limit, this.searchQuery()).subscribe({
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
    this.facade.toggleProtocol(this.useGraphQL() ? 'graphql' : 'rest');
    this.useGraphQL.set(!this.useGraphQL());
  }

  onSearch (event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  changePage (newPage: number): void {
    if (!this.facade.isValidPageChange(newPage, this.totalPages)) return;
    this.page.set(newPage);
    this.loadTableData();
  }

  isCurrentUser (id: number): boolean {
    return this.facade.isCurrentUser(id);
  }

  isRestrictedTable (): boolean {
    return this.facade.isRestrictedTable(this.selectedTable());
  }

  isFieldExcluded (col: string): boolean {
    return this.facade.isFieldExcludedFromUpdate(col, this.selectedRecord());
  }

  isFieldDisabled (c: string): boolean {
    return this.facade.isFieldDisabled(c, this.selectedTable(), this.modalMode());
  }

  isFieldInMetadata (c: string): boolean {
    return this.selectedTable()?.columns.some((col) => col.name === c) ?? false;
  }

  generatePassword (): void {
    this.updateFormData.update((c) => ({ ...c, password: this.facade.generateRandomPassword() }));
  }

  canDeleteRecord (): boolean {
    return this.facade.canDeleteRecord();
  }

  formatValue (v: unknown, c: Column): string {
    return this.facade.formatValue(v, c);
  }

  getBooleanValue (r: Record<string, unknown>, c: string): boolean {
    return this.facade.getBooleanValue(
      r,
      c,
      this.getRecordDraftData(this.facade.getNumberValue(r, 'id')),
    );
  }

  getNumberValue (r: Record<string, unknown>, c: string): number {
    return this.facade.getNumberValue(r, c);
  }

  getFieldDisplayName (f: string): string {
    return this.facade.getFieldDisplayName(f);
  }

  getUserInitials (r: Record<string, unknown>): string {
    return this.facade.getUserInitials(r);
  }

  isImageUrl (n: string): boolean {
    return this.facade.isImageUrl(n);
  }

  getAvailableRoles (): { value: string; label: string }[] {
    return this.facade.getAvailableRoles();
  }

  getHeaderClasses (n: string, t: string): string {
    return this.facade.getHeaderClasses(n, t);
  }

  getCellClasses (n: string, t: string): string {
    return this.facade.getCellClasses(n, t);
  }

  getColumnStyles (n: string, t: string): Record<string, string> {
    return this.facade.getColumnStyles(n, t);
  }

  hasAnyActions (): boolean {
    return this.facade.hasAnyActions(this.selectedTable());
  }

  canModifySensitiveFields (): boolean {
    return this.facade.canModifySensitiveFields();
  }

  isSensitiveField (n: string): boolean {
    return this.facade.isSensitiveField(n);
  }

  formatFieldValue (v: unknown): string {
    return this.facade.formatFieldValue(v);
  }

  updateFormField (f: string, v: unknown): void {
    this.updateFormData.update((c) => ({ ...c, [f]: v }));
  }

  hasFormChanges (): boolean {
    return this.facade.hasFormChanges(this.updateFormData(), this.originalFormData());
  }

  isFieldChanged (f: string): boolean {
    return this.facade.isFieldChanged(f, this.updateFormData(), this.originalFormData());
  }

  getChangedFields (): Array<{ name: string; oldValue: unknown; newValue: unknown }> {
    return this.facade.getChangedFields(this.updateFormData(), this.originalFormData());
  }

  isRoleInvalid (): boolean {
    return this.facade.isRoleInvalid(this.updateFormData());
  }

  isFormInvalid (): boolean {
    return this.facade.isFormInvalid(this.updateFormData(), this.originalFormData());
  }

  getModalTitle (): string {
    return this.facade.getModalTitle(this.modalMode());
  }

  getSubmitButtonText (): string {
    return this.facade.getSubmitButtonText(this.modalMode(), this.hasFormChanges());
  }

  getSubmitButtonIcon (): string {
    return this.facade.getSubmitButtonIcon(this.modalMode());
  }

  getUpdateButtonTooltip (): string {
    return this.facade.getUpdateButtonTooltip(this.updateFormData(), this.originalFormData());
  }

  createRecord (): void {
    const table = this.selectedTable();
    if (!table) return;
    const formData = this.facade.prepareCreateFormData(table);
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
    const formData = this.facade.prepareFormData(table, record, (columnName) =>
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
      success = this.facade.validateAndSubmitCreate(table, this.updateFormData());
    } else {
      const record = this.selectedRecord();
      if (!record) return;
      success = this.facade.validateAndSubmitUpdate(
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

    this.facade.confirmDelete(id, () => {
      const record = this.tableData().find((row) => row['id'] === id);
      if (!record) return;
      this.facade.createDeleteDraft(table, id, record);
    });
  }

  updateBooleanValue (record: Record<string, unknown>, column: Column, newValue: boolean): void {
    const table = this.selectedTable();
    this.facade.handleBooleanUpdate(
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
    if (this.facade.isGraphQL()) {
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

      this.facade.bulkUpdate(operations, true).subscribe({
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
      this.facade.publishAllChanges(
        this.hasDrafts(),
        (value) => this.isPublishing.set(value),
        () => this.loadTableData(false),
      );
    }
  }

  resetAllChanges (): void {
    this.facade.resetAllChanges(this.hasDrafts(), this.draftCount(), () =>
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
    this.facade.handleImageClick(imageUrl);
  }

  private resetTableScroll (): void {
    setTimeout(() => {
      if (this.tableScrollContainer) {
        this.tableScrollContainer.nativeElement.scrollLeft = 0;
      }
    }, 100);
  }
}
