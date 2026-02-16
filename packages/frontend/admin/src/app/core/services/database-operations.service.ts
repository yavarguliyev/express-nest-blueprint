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

  loadSchema (options?: { refresh?: boolean; showToast?: boolean }): Observable<ApiResponse<Schema>> {
    const url = options?.refresh ? `${API_ENDPOINTS.ADMIN.SCHEMA}?t=${Date.now()}` : API_ENDPOINTS.ADMIN.SCHEMA;

    return new Observable((observer) => {
      this.http.get<ApiResponse<Schema>>(url).subscribe({
        next: (res) => {
          if (options?.showToast) {
            if (res.success) {
              this.toastService.success('Schema loaded successfully');
            } else {
              this.toastService.error('Failed to load schema');
            }
          }
          observer.next(res);
          observer.complete();
        },
        error: (error) => {
          if (options?.showToast) {
            this.toastService.error('Failed to load database schema');
          }
          observer.error(error);
        },
      });
    });
  }

  loadTableData (
    table: TableMetadata,
    page: number,
    limit: number,
    searchQuery: string,
    options?: { refresh?: boolean; showToast?: boolean },
  ): Observable<ApiResponse<PaginatedResponse<Record<string, unknown>>>> {
    const url = API_ENDPOINTS.ADMIN.CRUD(table.category, table.name);
    const timestamp = options?.refresh !== false ? Date.now() : undefined;

    return new Observable((observer) => {
      this.http
        .get<ApiResponse<PaginatedResponse<Record<string, unknown>>>>(url, {
          params: {
            page: page.toString(),
            limit: limit.toString(),
            search: searchQuery,
            ...(timestamp && { t: timestamp.toString() }),
          },
        })
        .subscribe({
          next: (res) => {
            if (options?.showToast) {
              if (res.success) {
                this.toastService.success('Table data loaded successfully');
              } else {
                this.toastService.error('Failed to load table data');
              }
            }
            observer.next(res);
            observer.complete();
          },
          error: (error) => {
            if (options?.showToast) {
              this.toastService.error(`Failed to load ${table.name} data`);
            }
            observer.error(error);
          },
        });
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
}
