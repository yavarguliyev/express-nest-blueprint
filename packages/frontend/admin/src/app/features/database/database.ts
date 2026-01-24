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
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { DatabaseDraftService } from '../../core/services/database-draft.service';
import { TextTransformService } from '../../core/services/text-transform.service';
import { TableStyleService } from '../../core/services/table-style.service';
import { DateFormatService } from '../../core/services/date-format.service';
import { UserRoleHelper } from '../../core/enums/user-roles.enum';
import { ToggleSwitch } from '../../shared/components/toggle-switch/toggle-switch';
import { ActionButtons } from '../../shared/components/action-buttons/action-buttons';
import {
  DraftStatusBar,
  DraftStatusConfig,
} from '../../shared/components/draft-status-bar/draft-status-bar';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints';

interface Column {
  name: string;
  type: string;
  required: boolean;
  editable: boolean;
}

interface TableMetadata {
  category: string;
  name: string;
  displayName: string;
  tableName: string;
  columns: Column[];
  actions?: {
    create?: boolean;
    update?: boolean;
    delete?: boolean;
  };
}

interface Schema {
  [category: string]: TableMetadata[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'app-database',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleSwitch, ActionButtons, DraftStatusBar],
  templateUrl: './database.html',
  styleUrl: './database.css',
})
export class Database implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  draftService = inject(DatabaseDraftService);
  private textTransform = inject(TextTransformService);
  private tableStyle = inject(TableStyleService);
  private dateFormat = inject(DateFormatService);

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

  constructor () {
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe((query) => {
      this.searchQuery.set(query);
      this.page.set(1);
      this.loadTableData();
    });
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey (event: KeyboardEvent) {
    if (this.showUpdateModal()) {
      this.closeUpdateModal();
      event.preventDefault();
    }
  }

  ngOnInit () {
    if (window.location.pathname.includes('/database')) {
      this.loadSchema();
    }
  }

  ngAfterViewInit () {
    if (this.tableScrollContainer) {
      this.setupScrollIndicators();
    }
  }

  debugTableData () {}

  loadSchema () {
    if (this.schema()) {
      return;
    }

    this.loadingSchema.set(true);
    this.http.get<ApiResponse<Schema>>(API_ENDPOINTS.ADMIN.SCHEMA).subscribe({
      next: (res) => {
        const schemaData = res.data;
        this.schema.set(schemaData);
        this.loadingSchema.set(false);

        const categories = Object.keys(schemaData);
        if (categories.length > 0) {
          const firstCategory = categories[0];
          if (firstCategory) {
            this.toggleCategory(firstCategory);
          }
        }
      },
      error: () => {
        this.toastService.error('Failed to project database schema matrix.');
        this.loadingSchema.set(false);
      },
    });
  }

  toggleCategory (category: string) {
    this.expandedCategories.update((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }

  selectTable (table: TableMetadata) {
    if (this.selectedTable()?.name === table.name) {
      this.selectedTable.set(null);
      this.tableData.set([]);
      return;
    }

    this.selectedTable.set(table);
    this.page.set(1);
    this.loadTableData();
  }

  loadTableData (resetScroll = true) {
    const table = this.selectedTable();
    if (!table) return;

    this.loadingData.set(true);
    const url = API_ENDPOINTS.ADMIN.CRUD(table.category, table.name);
    this.http
      .get<ApiResponse<PaginatedResponse<Record<string, unknown>>>>(url, {
        params: {
          page: this.page().toString(),
          limit: this.limit.toString(),
          search: this.searchQuery(),
        },
      })
      .subscribe({
        next: (res) => {
          const responseData = res.data;
          if (responseData && Array.isArray(responseData.data)) {
            this.tableData.set(responseData.data);
            this.total.set(responseData.total || responseData.data.length);

            if (resetScroll) {
              setTimeout(() => {
                if (this.tableScrollContainer) {
                  this.tableScrollContainer.nativeElement.scrollLeft = 0;
                }
              }, 100);
            }
          } else {
            this.tableData.set([]);
            this.total.set(0);
          }
          this.loadingData.set(false);
        },
        error: () => {
          this.toastService.error(`Failed to synchronize with sector ${table.name}.`);
          this.loadingData.set(false);
        },
      });
  }

  onSearch (event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  changePage (newPage: number) {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.page.set(newPage);
    this.loadTableData();
  }

  get totalPages (): number {
    return Math.ceil(this.total() / this.limit);
  }

  get pages (): number[] {
    const total = this.totalPages;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    let start = Math.max(1, this.page() - 2);
    const end = Math.min(total, start + 4);
    if (end === total) start = Math.max(1, total - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  isCurrentUser (id: number): boolean {
    const user = this.authService.getCurrentUser();
    return user ? String(user.id) === String(id) : false;
  }

  isRestrictedTable (): boolean {
    return this.selectedTable()?.tableName === 'users';
  }

  isFieldRestricted (_id: number, _colName: string): boolean {
    void _id;
    void _colName;
    return false;
  }

  isFieldExcludedFromUpdate (columnName: string): boolean {
    const excludedFields = ['id', 'isActive', 'isEmailVerified', 'profileImageUrl'];

    const currentUser = this.authService.getCurrentUser();
    const selectedRecord = this.selectedRecord();

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

  updateRecord (id: number) {
    const table = this.selectedTable();
    if (!table || !id) return;

    const record = this.tableData().find((row) => row['id'] === id);
    if (!record) return;

    const formData: Record<string, unknown> = {};
    table.columns.forEach((col) => {
      if (col.editable && !this.isFieldExcludedFromUpdate(col.name)) {
        formData[col.name] = record[col.name];
      }
    });

    this.draftService.createDraft(
      {
        type: 'update',
        table: table.name,
        category: table.category,
        recordId: id,
        data: formData,
      },
      record,
    );

    this.selectedRecord.set(record);
    this.updateFormData.set(formData);
    this.originalFormData.set({ ...formData });
    this.showUpdateModal.set(true);
  }

  closeUpdateModal () {
    this.showUpdateModal.set(false);
    this.selectedRecord.set(null);
    this.updateFormData.set({});
    this.originalFormData.set({});
  }

  submitUpdate () {
    const table = this.selectedTable();
    const record = this.selectedRecord();
    if (!table || !record) return;

    const currentData = this.updateFormData();
    const originalData = this.originalFormData();

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
      return;
    }

    if (
      Object.prototype.hasOwnProperty.call(changedData, 'role') &&
      (!changedData['role'] || changedData['role'] === '')
    ) {
      this.toastService.error('Please select a valid role before updating the record.');
      return;
    }

    const recordId = record['id'] as number;
    const draftId = `${table.category}:${table.name}:${recordId}`;

    this.draftService.updateDraft(draftId, currentData);

    this.toastService.success(
      `Changes saved as draft for record ${recordId}. Use "Save Changes" to apply all drafts.`,
    );
    this.closeUpdateModal();
  }

  updateFormField (fieldName: string, value: unknown) {
    this.updateFormData.update((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }

  deleteRecord (id: number) {
    const table = this.selectedTable();
    if (!table || !id) return;

    this.toastService.confirm(
      `Mark record ${id} for deletion? You can review and apply all changes with "Save Changes".`,
      () => {
        const record = this.tableData().find((row) => row['id'] === id);
        if (!record) return;

        this.draftService.createDraft(
          {
            type: 'delete',
            table: table.name,
            category: table.category,
            recordId: id,
          },
          record,
        );

        this.toastService.success(
          `Record ${id} marked for deletion. Use "Save Changes" to apply all changes.`,
        );
      },
    );
  }

  updateBooleanValue (record: Record<string, unknown>, column: Column, newValue: boolean) {
    const table = this.selectedTable();
    if (!table || !record || column.type !== 'boolean') return;

    if (this.isSensitiveField(column.name) && !this.canModifySensitiveFields()) {
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

      this.toastService.success(
        `${column.name} change saved as draft. Use "Save Changes" to apply all changes.`,
      );
    }
  }

  formatValue (value: unknown, column: Column): string {
    if (value === null || value === undefined) return '-';

    if (this.isRoleColumn(column.name) && typeof value === 'string') {
      return UserRoleHelper.getRoleDisplayName(value);
    }

    if (column.type === 'datetime') {
      return this.dateFormat.formatForTable(value as string);
    }

    if (column.type === 'boolean') return value ? 'ACTIVE' : 'INACTIVE';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value as string | number | boolean);
  }

  private isRoleColumn (columnName: string): boolean {
    const roleColumnNames = [
      'role',
      'user_role',
      'userRole',
      'account_role',
      'accountRole',
      'permission_level',
      'permissionLevel',
    ];

    return roleColumnNames.some((roleName) =>
      columnName.toLowerCase().includes(roleName.toLowerCase()),
    );
  }

  getBooleanValue (row: Record<string, unknown>, columnName: string): boolean {
    const recordId = this.getNumberValue(row, 'id');
    const draftData = this.getRecordDraftData(recordId);

    if (draftData && columnName in draftData) {
      return draftData[columnName] as boolean;
    }

    return row[columnName] as boolean;
  }

  getNumberValue (row: Record<string, unknown>, columnName: string): number {
    return row[columnName] as number;
  }

  getFieldDisplayName (fieldName: string): string {
    return this.textTransform.getDisplayName(fieldName);
  }

  getHeaderClasses (columnName: string, columnType: string): string {
    return this.tableStyle.getHeaderClasses(columnName, columnType);
  }

  getCellClasses (columnName: string, columnType: string): string {
    return this.tableStyle.getCellClasses(columnName, columnType);
  }

  getColumnStyles (columnName: string, columnType: string): Record<string, string> {
    return this.tableStyle.getColumnStyles(columnName, columnType);
  }

  isImageUrl (colName: string): boolean {
    return colName.toLowerCase().includes('image') || colName.toLowerCase().includes('avatar');
  }

  getAvailableRoles (): { value: string; label: string }[] {
    return [
      { value: 'global admin', label: 'Global Administrator' },
      { value: 'admin', label: 'Administrator' },
      { value: 'moderator', label: 'Moderator' },
      { value: 'user', label: 'User' },
    ];
  }

  isRoleInvalid (): boolean {
    const formData = this.updateFormData();
    return (
      Object.prototype.hasOwnProperty.call(formData, 'role') &&
      (!formData['role'] || formData['role'] === '')
    );
  }

  hasFormChanges (): boolean {
    const currentData = this.updateFormData();
    const originalData = this.originalFormData();

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

  isFieldChanged (fieldName: string): boolean {
    const currentData = this.updateFormData();
    const originalData = this.originalFormData();
    return currentData[fieldName] !== originalData[fieldName];
  }

  getChangedFields (): Array<{ name: string; oldValue: unknown; newValue: unknown }> {
    const currentData = this.updateFormData();
    const originalData = this.originalFormData();
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

  formatFieldValue (value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '(empty)';
    }
    if (typeof value === 'boolean') {
      return value ? 'Active' : 'Inactive';
    }
    if (typeof value === 'string') {
      if (value.includes('admin')) {
        return UserRoleHelper.getRoleDisplayName(value);
      }
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.formatFieldValue(item)).join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      if (value.toString !== Object.prototype.toString) {
        return (value as { toString(): string }).toString();
      }
      const obj = value as Record<string, unknown>;
      const searchableProps = ['name', 'title', 'label', 'value', 'text', 'description'];
      for (const prop of searchableProps) {
        if (prop in obj && typeof obj[prop] === 'string') {
          return obj[prop];
        }
      }
      return JSON.stringify(value);
    }
    return 'Unknown';
  }

  canDeleteRecord (): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? UserRoleHelper.isGlobalAdmin(currentUser.role) : false;
  }

  hasAnyActions (): boolean {
    const table = this.selectedTable();
    if (!table) return false;

    const actions = table.actions || { create: true, update: true, delete: true };
    return actions.update !== false || actions.delete !== false;
  }

  canModifySensitiveFields (): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? UserRoleHelper.isGlobalAdmin(currentUser.role) : false;
  }

  isSensitiveField (columnName: string): boolean {
    const sensitiveFields = ['isActive', 'isEmailVerified'];
    return sensitiveFields.includes(columnName);
  }

  handleImageClick (row: Record<string, unknown>, columnName: string): void {
    const imageUrl = row[columnName] as string;

    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      window.open(imageUrl, '_blank');
    } else {
      this.toastService.info('User does not have an image yet.');
    }
  }

  getUserInitials (row: Record<string, unknown>): string {
    const firstName = (row['firstName'] as string) || (row['first_name'] as string) || '';
    const lastName = (row['lastName'] as string) || (row['last_name'] as string) || '';

    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }

    const email = (row['email'] as string) || '';
    if (email) {
      return email.charAt(0).toUpperCase();
    }

    return 'U';
  }

  isFormInvalid (): boolean {
    return this.isRoleInvalid() || !this.hasFormChanges();
  }

  getUpdateButtonText (): string {
    if (this.isRoleInvalid()) {
      return 'Update Record';
    }
    if (!this.hasFormChanges()) {
      return 'No Changes';
    }
    return 'Update Record';
  }

  getUpdateButtonTooltip (): string {
    if (this.isRoleInvalid()) {
      return 'Please select a valid role before updating';
    }
    if (!this.hasFormChanges()) {
      return 'Make changes to enable update';
    }
    return 'Save changes to record';
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

  hasRecordDraft (recordId: number): boolean {
    const table = this.selectedTable();
    if (!table) return false;

    const draftId = `${table.category}:${table.name}:${recordId}`;
    return this.draftService.hasDraftChanges(draftId);
  }

  getRecordDraftType (recordId: number): 'create' | 'update' | 'delete' | null {
    const table = this.selectedTable();
    if (!table) return null;

    const draft = this.draftService.getDraftForRecord(table.category, table.name, recordId);
    return draft ? draft.operation : null;
  }

  isRecordMarkedForDeletion (recordId: number): boolean {
    return this.getRecordDraftType(recordId) === 'delete';
  }

  getRecordDraftData (recordId: number): Record<string, unknown> | null {
    const table = this.selectedTable();
    if (!table) return null;

    const draft = this.draftService.getDraftForRecord(table.category, table.name, recordId);
    return draft ? draft.draftData : null;
  }

  private setupScrollIndicators () {
    const container = this.tableScrollContainer.nativeElement;

    const updateScrollIndicators = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;

      container.classList.remove('scrolled-left', 'scrolled-right');
      if (scrollLeft > 0) {
        container.classList.add('scrolled-left');
      }

      if (scrollLeft < scrollWidth - clientWidth - 1) {
        container.classList.add('scrolled-right');
      }
    };

    setTimeout(updateScrollIndicators, 100);
    container.addEventListener('scroll', updateScrollIndicators);
    window.addEventListener('resize', updateScrollIndicators);
  }
}
