import { Component, inject, OnInit, signal, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { TextTransformService } from '../../core/services/text-transform.service';
import { TableStyleService } from '../../core/services/table-style.service';
import { DateFormatService } from '../../core/services/date-format.service';
import { UserRoleHelper } from '../../core/enums/user-roles.enum';
import { ToggleSwitch } from '../../shared/components/toggle-switch/toggle-switch';
import { ActionButtons } from '../../shared/components/action-buttons/action-buttons';

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
}

interface Schema {
  [category: string]: TableMetadata[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ErrorResponse {
  error?: {
    message?: string;
  };
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
  imports: [CommonModule, FormsModule, ToggleSwitch, ActionButtons],
  templateUrl: './database.html',
  styleUrl: './database.css',
})
export class Database implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
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

  constructor () {
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe((query) => {
      this.searchQuery.set(query);
      this.page.set(1);
      this.loadTableData();
    });
  }

  // ESC key listener to close modals
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey (event: KeyboardEvent) {
    if (this.showUpdateModal()) {
      this.closeUpdateModal();
      event.preventDefault();
    }
  }

  ngOnInit () {
    this.loadSchema();
  }

  ngAfterViewInit () {
    // Set up scroll event listener for scroll indicators
    if (this.tableScrollContainer) {
      this.setupScrollIndicators();
    }
  }

  // Debug method to check table data
  debugTableData () {
    // Debug method removed - console logs cleaned up
  }

  loadSchema () {
    this.loadingSchema.set(true);
    this.http.get<ApiResponse<Schema>>('/api/v1/admin/crud/schema').subscribe({
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
    const url = `/api/v1/admin/crud/${table.category}/${table.name}`;
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
            
            // Only reset scroll position when explicitly requested (new table/search)
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isFieldRestricted (_id: number, _colName: string): boolean {
    // Parameters prefixed with underscore to indicate intentional non-use
    // Remove client-side restrictions - let backend handle validation and show proper error messages
    return false;
  }

  // Helper method to check if a field should be excluded from the update modal
  isFieldExcludedFromUpdate (columnName: string): boolean {
    const excludedFields = [
      'id',
      'isActive',
      'isEmailVerified', 
      'profileImageUrl'
    ];
    
    const currentUser = this.authService.getCurrentUser();
    const selectedRecord = this.selectedRecord();
    
    // Handle role field exclusion logic
    if (columnName === 'role' && currentUser) {
      // If user is not global admin, exclude role field entirely
      if (!UserRoleHelper.canEditRoles(currentUser.role)) {
        excludedFields.push('role');
      }
      // If user is global admin but updating their own record, exclude role field
      else if (selectedRecord && this.isCurrentUser(selectedRecord['id'] as number)) {
        excludedFields.push('role');
      }
    }
    
    return excludedFields.includes(columnName);
  }

  // Helper method to check if a field should be disabled (like email)
  isFieldDisabled (columnName: string): boolean {
    const disabledFields = ['email'];
    return disabledFields.includes(columnName);
  }

  updateRecord (id: number) {
    const table = this.selectedTable();
    if (!table || !id) return;

    // Find the record to update
    const record = this.tableData().find(row => row['id'] === id);
    if (!record) return;

    // Initialize form data with current values, excluding certain fields
    const formData: Record<string, unknown> = {};
    table.columns.forEach(col => {
      if (col.editable && !this.isFieldExcludedFromUpdate(col.name)) {
        formData[col.name] = record[col.name];
      }
    });

    this.selectedRecord.set(record);
    this.updateFormData.set(formData);
    this.originalFormData.set({ ...formData }); // Store a copy of original data
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
    
    // Only send changed fields
    const changedData: Record<string, unknown> = {};
    for (const key in currentData) {
      if (Object.prototype.hasOwnProperty.call(currentData, key) && currentData[key] !== originalData[key]) {
        changedData[key] = currentData[key];
      }
    }
    
    // If no changes, don't proceed (this should be prevented by UI but double-check)
    if (Object.keys(changedData).length === 0) {
      this.toastService.error('No changes detected to update.');
      return;
    }
    
    // Validate role selection if role field is present and changed
    if (Object.prototype.hasOwnProperty.call(changedData, 'role') && (!changedData['role'] || changedData['role'] === '')) {
      this.toastService.error('Please select a valid role before updating the record.');
      return;
    }

    const recordId = record['id'] as number;

    this.http
      .patch<ApiResponse<void>>(`/api/v1/admin/crud/${table.category}/${table.name}/${recordId}`, changedData)
      .subscribe({
        next: () => {
          this.toastService.success(`Record ${recordId} updated successfully in ${table.displayName}.`);
          this.closeUpdateModal();
          this.loadTableData(false); // Don't reset scroll position
          
          // If this is a user table and the updated user is the current user, sync profile
          if (table.tableName === 'users' && this.isCurrentUser(recordId)) {
            void this.authService.syncProfile();
          }
        },
        error: (err: ErrorResponse) => {
          const msg = err.error?.message || err.message || 'Update operation failed.';
          this.toastService.error(msg);
        },
      });
  }

  updateFormField (fieldName: string, value: unknown) {
    this.updateFormData.update(current => ({
      ...current,
      [fieldName]: value
    }));
  }

  deleteRecord (id: number) {
    const table = this.selectedTable();
    if (!table || !id) return;

    // Remove client-side restriction - let backend handle validation and show proper error messages
    this.toastService.confirm(
      `CRITICAL: Purge record ${id} from ${table.displayName}? This action is immutable.`,
      () => {
        this.http.delete<ApiResponse<void>>(`/api/v1/admin/crud/${table.category}/${table.name}/${id}`).subscribe({
          next: () => {
            if (this.isCurrentUser(id)) {
              this.authService.logout();
            }
            this.toastService.success(`Record ${id} successfully purged from matrix.`);
            this.loadTableData(false); // Don't reset scroll position
          },
          error: (err: ErrorResponse) => {
            const msg = err.error?.message || err.message || 'Direct purge operation failed.';
            this.toastService.error(msg);
          },
        });
      }
    );
  }

  updateBooleanValue (record: Record<string, unknown>, column: Column, newValue: boolean) {
    const table = this.selectedTable();
    if (!table || !record || column.type !== 'boolean') return;

    // Check if this is a sensitive field and user has permission
    if (this.isSensitiveField(column.name) && !this.canModifySensitiveFields()) {
      this.toastService.error('Only Global Administrators can modify user activation and email verification status.');
      return;
    }

    const recordId = record['id'] as number;

    const updateData = { [column.name]: newValue };

    this.http
      .patch<ApiResponse<void>>(`/api/v1/admin/crud/${table.category}/${table.name}/${recordId}`, updateData)
      .subscribe({
        next: () => {
          this.toastService.success(
            `${column.name} updated to ${newValue ? 'ACTIVE' : 'OFFLINE'} for record ${recordId}.`,
          );
          this.loadTableData(false); // Don't reset scroll position
        },
        error: (err: ErrorResponse) => {
          const msg = err.error?.message || err.message || `Failed to toggle ${column.name} state.`;
          this.toastService.error(msg);
          this.loadTableData(false); // Don't reset scroll position
        },
      });
  }

  // Helper to format values for display
  formatValue (value: unknown, column: Column): string {
    if (value === null || value === undefined) return '-';
    
    // Dynamic role column detection and formatting
    if (this.isRoleColumn(column.name) && typeof value === 'string') {
      return UserRoleHelper.getRoleDisplayName(value);
    }
    
    // Simple datetime formatting - no special cases
    if (column.type === 'datetime') {
      return this.dateFormat.formatForTable(value as string);
    }
    
    if (column.type === 'boolean') return value ? 'ACTIVE' : 'INACTIVE';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value as string | number | boolean);
  }

  // Helper method to detect if a column contains role data
  private isRoleColumn (columnName: string): boolean {
    const roleColumnNames = [
      'role', 
      'user_role', 
      'userRole', 
      'account_role', 
      'accountRole',
      'permission_level',
      'permissionLevel'
    ];
    
    return roleColumnNames.some(roleName => 
      columnName.toLowerCase().includes(roleName.toLowerCase())
    );
  }

  // Helper method to get boolean value safely
  getBooleanValue (row: Record<string, unknown>, columnName: string): boolean {
    return row[columnName] as boolean;
  }

  // Helper method to get number value safely
  getNumberValue (row: Record<string, unknown>, columnName: string): number {
    return row[columnName] as number;
  }

  // Helper method to get display name for field
  getFieldDisplayName (fieldName: string): string {
    return this.textTransform.getDisplayName(fieldName);
  }

  // Helper methods for table styling
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

  // Get available roles for dropdown
  getAvailableRoles (): { value: string; label: string }[] {
    return [
      { value: 'global admin', label: 'Global Administrator' },
      { value: 'admin', label: 'Administrator' },
      { value: 'moderator', label: 'Moderator' },
      { value: 'user', label: 'User' }
    ];
  }

  // Check if role selection is invalid
  isRoleInvalid (): boolean {
    const formData = this.updateFormData();
    return Object.prototype.hasOwnProperty.call(formData, 'role') && (!formData['role'] || formData['role'] === '');
  }

  // Check if there are any changes in the form data
  hasFormChanges (): boolean {
    const currentData = this.updateFormData();
    const originalData = this.originalFormData();
    
    // Compare each field
    for (const key in currentData) {
      if (currentData[key] !== originalData[key]) {
        return true;
      }
    }
    
    // Also check if any original fields were removed (shouldn't happen in our case)
    for (const key in originalData) {
      if (!(key in currentData)) {
        return true;
      }
    }
    
    return false;
  }

  // Check if a specific field has been changed
  isFieldChanged (fieldName: string): boolean {
    const currentData = this.updateFormData();
    const originalData = this.originalFormData();
    return currentData[fieldName] !== originalData[fieldName];
  }

  // Get list of changed fields with old and new values
  getChangedFields (): Array<{name: string; oldValue: unknown; newValue: unknown}> {
    const currentData = this.updateFormData();
    const originalData = this.originalFormData();
    const changes: Array<{name: string; oldValue: unknown; newValue: unknown}> = [];
    
    for (const key in currentData) {
      if (Object.prototype.hasOwnProperty.call(currentData, key) && currentData[key] !== originalData[key]) {
        changes.push({
          name: key,
          oldValue: originalData[key],
          newValue: currentData[key]
        });
      }
    }
    
    return changes;
  }

  // Format field value for display in changes summary
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
      return value.map(item => this.formatFieldValue(item)).join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      // Check if object has a custom toString method
      if (value.toString !== Object.prototype.toString) {
        return (value as { toString(): string }).toString();
      }
      // Try to find searchable properties
      const obj = value as Record<string, unknown>;
      const searchableProps = ['name', 'title', 'label', 'value', 'text', 'description'];
      for (const prop of searchableProps) {
        if (prop in obj && typeof obj[prop] === 'string') {
          return obj[prop];
        }
      }
      // Fallback to JSON stringify
      return JSON.stringify(value);
    }
    // For any other primitive types (symbol, bigint, etc.)
    return 'Unknown';
  }

  // Check if current user can delete records (only global admin)
  canDeleteRecord (): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? UserRoleHelper.isGlobalAdmin(currentUser.role) : false;
  }

  // Check if current user can modify sensitive fields (only global admin)
  canModifySensitiveFields (): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? UserRoleHelper.isGlobalAdmin(currentUser.role) : false;
  }

  // Check if a specific field is sensitive (isActive, isEmailVerified)
  isSensitiveField (columnName: string): boolean {
    const sensitiveFields = ['isActive', 'isEmailVerified'];
    return sensitiveFields.includes(columnName);
  }

  // Handle image click functionality
  handleImageClick (row: Record<string, unknown>, columnName: string): void {
    const imageUrl = row[columnName] as string;
    
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      // Open image in new tab for full screen view
      window.open(imageUrl, '_blank');
    } else {
      // Show message that user doesn't have an image
      this.toastService.info('User does not have an image yet.');
    }
  }

  // Get user initials for profile image placeholder
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
    
    // Fallback to email or id
    const email = (row['email'] as string) || '';
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    
    return 'U'; // Default fallback
  }

  // Check if the entire form is invalid
  isFormInvalid (): boolean {
    return this.isRoleInvalid() || !this.hasFormChanges();
  }

  // Get dynamic button text based on form state
  getUpdateButtonText (): string {
    if (this.isRoleInvalid()) {
      return 'Update Record';
    }
    if (!this.hasFormChanges()) {
      return 'No Changes';
    }
    return 'Update Record';
  }

  // Get tooltip for update button
  getUpdateButtonTooltip (): string {
    if (this.isRoleInvalid()) {
      return 'Please select a valid role before updating';
    }
    if (!this.hasFormChanges()) {
      return 'Make changes to enable update';
    }
    return 'Save changes to record';
  }

  private setupScrollIndicators () {
    const container = this.tableScrollContainer.nativeElement;
    
    const updateScrollIndicators = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      
      // Remove existing classes
      container.classList.remove('scrolled-left', 'scrolled-right');
      
      // Add appropriate classes based on scroll position
      if (scrollLeft > 0) {
        container.classList.add('scrolled-left');
      }
      
      if (scrollLeft < scrollWidth - clientWidth - 1) {
        container.classList.add('scrolled-right');
      }
    };

    // Initial check
    setTimeout(updateScrollIndicators, 100);
    
    // Listen for scroll events
    container.addEventListener('scroll', updateScrollIndicators);
    
    // Listen for resize events
    window.addEventListener('resize', updateScrollIndicators);
  }
}