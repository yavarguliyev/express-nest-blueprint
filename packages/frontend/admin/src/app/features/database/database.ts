import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './database.html',
  styleUrl: './database.css',
})
export class Database implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

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

  constructor () {
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe((query) => {
      this.searchQuery.set(query);
      this.page.set(1);
      this.loadTableData();
    });
  }

  ngOnInit () {
    this.loadSchema();
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

  toggleBoolean (record: Record<string, any>, column: Column) {
    const table = this.selectedTable();
    if (!table || !record || column.type !== 'boolean') return;

    const recordId = record['id'] as number;

    // Remove client-side restriction - let backend handle validation and show proper error messages
    const newValue = !record[column.name];
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
    if (column.type === 'boolean') return value ? 'ACTIVE' : 'INACTIVE';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value as string | number | boolean);
  }

  isImageUrl (colName: string): boolean {
    return colName.toLowerCase().includes('image') || colName.toLowerCase().includes('avatar');
  }
}
