import { Component, inject, OnInit, signal, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { TextTransformService } from '../../core/services/text-transform.service';
import { TableStyleService } from '../../core/services/table-style.service';
import { DateFormatService } from '../../core/services/date-format.service';
import { UserRoleHelper } from '../../core/enums/user-roles.enum';
import { ToggleSwitch } from '../../shared/components/toggle-switch/toggle-switch';
import { ActionButtons } from '../../shared/components/action-buttons/action-buttons';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

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

  tableData = signal<Record<string, any>[]>([]);
  total = signal(0);
  page = signal(1);
  limit = 10;
  searchQuery = signal('');
  private searchSubject = new Subject<string>();
  selectedRecord = signal<Record<string, any> | null>(null);
  showUpdateModal = signal(false);
  updateFormData = signal<Record<string, any>>({});

  constructor () {
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe((query) => {
      this.searchQuery.set(query);
      this.page.set(1);
      this.loadTableData();
    });
  }

  // ESC key listener to close modals
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.showUpdateModal()) {
      this.closeUpdateModal();
      event.preventDefault();
    }
  }

  ngOnInit () {
    this.loadSchema();
  }

  ngAfterViewInit() {
    // Set up scroll event listener for scroll indicators
    if (this.tableScrollContainer) {
      this.setupScrollIndicators();
    }
  }

  // Debug method to check table data
  debugTableData() {
    console.log('Selected table:', this.selectedTable());
    console.log('Table columns:', this.selectedTable()?.columns);
    console.log('Table data:', this.tableData());
  }

  loadSchema () {
    this.loadingSchema.set(true);
    this.http.get<ApiResponse<Schema>>('/api/v1/admin/crud/schema').subscribe({
      next: (res) => {
        const schemaData = res.data;
        this.schema.set(schemaData);
        this.loadingSchema.set(false);
        
        // Debug: Log the schema data
        console.log('Schema loaded:', schemaData);
        
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
    
    // Debug: Log the selected table and its columns
    console.log('Selected table:', table);
    console.log('Table columns:', table.columns);
    
    this.selectedTable.set(table);
    this.page.set(1);
    this.loadTableData();
  }

  loadTableData () {
    const table = this.selectedTable();
    if (!table) return;

    this.loadingData.set(true);
    const url = `/api/v1/admin/crud/${table.category}/${table.name}`;
    this.http
      .get<ApiResponse<PaginatedResponse<Record<string, any>>>>(url, {
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
            
            // Reset scroll position to show first columns
            setTimeout(() => {
              if (this.tableScrollContainer) {
                this.tableScrollContainer.nativeElement.scrollLeft = 0;
              }
            }, 100);
          } else {
            this.tableData.set([]);
            this.total.set(0);
          }
          this.loadingData.set(false);
        },
        error: (err) => {
          console.error('Table load error:', err);
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
  isFieldExcludedFromUpdate(columnName: string): boolean {
    const excludedFields = [
      'id',
      'isActive',
      'isEmailVerified', 
      'profileImageUrl'
    ];
    
    // Add role to excluded fields if user is not global admin
    const currentUser = this.authService.getCurrentUser();
    if (columnName === 'role' && currentUser && !UserRoleHelper.canEditRoles(currentUser.role)) {
      excludedFields.push('role');
    }
    
    // Debug: Log role exclusion logic
    if (columnName === 'role') {
      console.log('Role field check:', {
        currentUser: currentUser?.role,
        canEditRoles: currentUser ? UserRoleHelper.canEditRoles(currentUser.role) : false,
        isExcluded: excludedFields.includes('role')
      });
    }
    
    return excludedFields.includes(columnName);
  }

  // Helper method to check if a field should be disabled (like email)
  isFieldDisabled(columnName: string): boolean {
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
    const formData: Record<string, any> = {};
    table.columns.forEach(col => {
      if (col.editable && !this.isFieldExcludedFromUpdate(col.name)) {
        formData[col.name] = record[col.name];
      }
    });

    // Debug: Log the form data to ensure role is included
    console.log('Update form data:', formData);
    console.log('Record role:', record['role']);

    this.selectedRecord.set(record);
    this.updateFormData.set(formData);
    this.showUpdateModal.set(true);
  }

  closeUpdateModal() {
    this.showUpdateModal.set(false);
    this.selectedRecord.set(null);
    this.updateFormData.set({});
  }

  submitUpdate() {
    const table = this.selectedTable();
    const record = this.selectedRecord();
    if (!table || !record) return;

    const updateData = this.updateFormData();
    
    // Validate role selection if role field is present and editable
    if (updateData.hasOwnProperty('role') && (!updateData['role'] || updateData['role'] === '')) {
      this.toastService.error('Please select a valid role before updating the record.');
      return;
    }

    const recordId = record['id'] as number;

    this.http
      .patch<ApiResponse<void>>(`/api/v1/admin/crud/${table.category}/${table.name}/${recordId}`, updateData)
      .subscribe({
        next: () => {
          this.toastService.success(`Record ${recordId} updated successfully in ${table.displayName}.`);
          this.closeUpdateModal();
          this.loadTableData();
          
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

  updateFormField(fieldName: string, value: any) {
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
            this.loadTableData();
          },
          error: (err: ErrorResponse) => {
            const msg = err.error?.message || err.message || 'Direct purge operation failed.';
            this.toastService.error(msg);
          },
        });
      }
    );
  }

  updateBooleanValue (record: Record<string, any>, column: Column, newValue: boolean) {
    const table = this.selectedTable();
    if (!table || !record || column.type !== 'boolean') return;

    const recordId = record['id'] as number;

    // Remove client-side restriction - let backend handle validation and show proper error messages
    const updateData = { [column.name]: newValue };

    this.http
      .patch<ApiResponse<void>>(`/api/v1/admin/crud/${table.category}/${table.name}/${recordId}`, updateData)
      .subscribe({
        next: () => {
          this.toastService.success(
            `${column.name} updated to ${newValue ? 'ACTIVE' : 'OFFLINE'} for record ${recordId}.`,
          );
          this.loadTableData();
        },
        error: (err: ErrorResponse) => {
          const msg = err.error?.message || err.message || `Failed to toggle ${column.name} state.`;
          this.toastService.error(msg);
          this.loadTableData();
        },
      });
  }

  // Helper to format values for display
  formatValue (value: unknown, column: Column): string {
    if (value === null || value === undefined) return '-';
    
    // Simple datetime formatting - no special cases
    if (column.type === 'datetime') {
      return this.dateFormat.formatForTable(value as string);
    }
    
    if (column.type === 'boolean') return value ? 'ACTIVE' : 'INACTIVE';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value as string | number | boolean);
  }

  // Helper method to get display name for field
  getFieldDisplayName(fieldName: string): string {
    return this.textTransform.getDisplayName(fieldName);
  }

  // Helper methods for table styling
  getHeaderClasses(columnName: string, columnType: string): string {
    return this.tableStyle.getHeaderClasses(columnName, columnType);
  }

  getCellClasses(columnName: string, columnType: string): string {
    return this.tableStyle.getCellClasses(columnName, columnType);
  }

  getColumnStyles(columnName: string, columnType: string): Record<string, string> {
    return this.tableStyle.getColumnStyles(columnName, columnType);
  }

  isImageUrl (colName: string): boolean {
    return colName.toLowerCase().includes('image') || colName.toLowerCase().includes('avatar');
  }

  // Get available roles for dropdown
  getAvailableRoles(): { value: string; label: string }[] {
    return [
      { value: 'global admin', label: 'Global Administrator' },
      { value: 'admin', label: 'Administrator' },
      { value: 'moderator', label: 'Moderator' },
      { value: 'user', label: 'User' }
    ];
  }

  // Check if role selection is invalid
  isRoleInvalid(): boolean {
    const formData = this.updateFormData();
    return formData.hasOwnProperty('role') && (!formData['role'] || formData['role'] === '');
  }

  // Check if the entire form is invalid
  isFormInvalid(): boolean {
    return this.isRoleInvalid();
  }

  private setupScrollIndicators() {
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