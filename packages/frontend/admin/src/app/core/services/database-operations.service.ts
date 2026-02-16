import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ToastService } from './toast.service';
import { DatabaseDraftService } from './database-draft.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
export { DatabaseOperation } from '../interfaces/database-bulk.interface';

export interface Column {
  name: string;
  type: string;
  required: boolean;
  editable: boolean;
}

export interface TableMetadata {
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

export interface Schema {
  [category: string]: TableMetadata[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class DatabaseOperationsService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private draftService = inject(DatabaseDraftService);

  loadSchema (): Observable<ApiResponse<Schema>> {
    return this.http.get<ApiResponse<Schema>>(API_ENDPOINTS.ADMIN.SCHEMA);
  }

  loadTableData (
    table: TableMetadata,
    page: number,
    limit: number,
    searchQuery: string,
  ): Observable<ApiResponse<PaginatedResponse<Record<string, unknown>>>> {
    const url = API_ENDPOINTS.ADMIN.CRUD(table.category, table.name);
    return this.http.get<ApiResponse<PaginatedResponse<Record<string, unknown>>>>(url, {
      params: {
        page: page.toString(),
        limit: limit.toString(),
        search: searchQuery,
        t: new Date().getTime().toString(),
      },
    });
  }

  updateRecord (
    table: TableMetadata,
    id: number,
    data: Record<string, unknown>,
  ): Observable<ApiResponse<Record<string, unknown>>> {
    const url = `${API_ENDPOINTS.ADMIN.CRUD(table.category, table.name)}/${id}`;
    return this.http.put<ApiResponse<Record<string, unknown>>>(url, data);
  }

  deleteRecord (table: TableMetadata, id: number): Observable<ApiResponse<void>> {
    const url = `${API_ENDPOINTS.ADMIN.CRUD(table.category, table.name)}/${id}`;
    return this.http.delete<ApiResponse<void>>(url);
  }

  refreshSchema (): Observable<ApiResponse<Schema>> {
    return this.loadSchema();
  }

  refreshTableData (
    table: TableMetadata,
    page: number,
    limit: number,
    searchQuery: string,
  ): Observable<ApiResponse<PaginatedResponse<Record<string, unknown>>>> {
    return this.loadTableData(table, page, limit, searchQuery);
  }

  bulkDelete (
    table: TableMetadata,
    ids: number[],
  ): Observable<ApiResponse<{ deletedCount: number; message: string }>> {
    const url = `${API_ENDPOINTS.ADMIN.CRUD(table.category, table.name)}/bulk-delete`;
    return this.http.post<ApiResponse<{ deletedCount: number; message: string }>>(url, { ids });
  }

  createUpdateDraft (
    table: TableMetadata,
    record: Record<string, unknown>,
    formData: Record<string, unknown>,
  ): void {
    const recordId = record['id'] as number;

    this.draftService.createDraft(
      {
        type: 'update',
        table: table.name,
        category: table.category,
        recordId: recordId,
        data: formData,
      },
      record,
    );
  }

  createDeleteDraft (table: TableMetadata, recordId: number, record: Record<string, unknown>): void {
    this.draftService.createDraft(
      {
        type: 'delete',
        table: table.name,
        category: table.category,
        recordId: recordId,
      },
      record,
    );
  }

  confirmDelete (recordId: number, onConfirm: () => void): void {
    this.toastService.confirm(
      `Mark record ${recordId} for deletion? You can review and apply all changes with "Save Changes".`,
      onConfirm,
    );
  }

  loadSchemaWithCache (): Observable<{ success: boolean; data: Schema }> {
    return this.loadSchema();
  }

  refreshSchemaWithToast (): Observable<{ success: boolean; data: Schema }> {
    return new Observable((observer) => {
      this.refreshSchema().subscribe({
        next: (res) => {
          this.toastService.success('Schema refreshed successfully');
          observer.next(res);
          observer.complete();
        },
        error: (error) => {
          this.toastService.error('Failed to refresh database schema.');
          observer.error(error);
        },
      });
    });
  }

  refreshTableDataWithToast (
    table: TableMetadata,
    page: number,
    limit: number,
    searchQuery: string,
  ): Observable<{ success: boolean; data: { data: Record<string, unknown>[]; total: number } }> {
    return new Observable((observer) => {
      this.refreshTableData(table, page, limit, searchQuery).subscribe({
        next: (res) => {
          this.toastService.success('Table data refreshed successfully');
          observer.next(res);
          observer.complete();
        },
        error: (error) => {
          this.toastService.error(`Failed to refresh ${table.name} data.`);
          observer.error(error);
        },
      });
    });
  }

  loadTableDataWithCache (
    table: TableMetadata,
    page: number,
    limit: number,
    searchQuery: string,
  ): Observable<{ success: boolean; data: { data: Record<string, unknown>[]; total: number } }> {
    return this.loadTableData(table, page, limit, searchQuery);
  }
}
