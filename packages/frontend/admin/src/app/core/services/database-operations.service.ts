import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ToastService } from './toast.service';
import { DatabaseDraftService } from './database-draft.service';
import { ApiService, ApiResponse } from './base/api.service';
import { ApiConfigService } from './api-config.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
export { DatabaseOperation } from '../interfaces/database-bulk.interface';
export type { ApiResponse };

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
  private api = inject(ApiService);
  private apiConfig = inject(ApiConfigService);
  private toastService = inject(ToastService);
  private draftService = inject(DatabaseDraftService);
  private readonly GQL_URL = '/admin/graphql';

  loadSchema (options?: { refresh?: boolean; showToast?: boolean }): Observable<ApiResponse<Schema>> {
    if (this.apiConfig.isGraphQL()) {
      return this.loadSchemaGraphQL(options);
    }
    return this.loadSchemaREST(options);
  }

  private loadSchemaREST (options?: { refresh?: boolean; showToast?: boolean }): Observable<ApiResponse<Schema>> {
    const url = options?.refresh ? `${API_ENDPOINTS.ADMIN.SCHEMA}?t=${Date.now()}` : API_ENDPOINTS.ADMIN.SCHEMA;

    return new Observable((observer) => {
      this.api.get<Schema>(url).subscribe({
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

  private loadSchemaGraphQL (options?: { refresh?: boolean; showToast?: boolean }): Observable<ApiResponse<Schema>> {
    const query = `query { adminGetSchema }`;

    return new Observable((observer) => {
      this.api.graphql<{ adminGetSchema: Schema }>(this.GQL_URL, query).subscribe({
        next: (res) => {
          const schemaResponse: ApiResponse<Schema> = {
            success: res.success,
            data: res.data.adminGetSchema,
            message: res.message,
          };

          if (options?.showToast) {
            if (schemaResponse.success) {
              this.toastService.success('Schema loaded successfully');
            } else {
              this.toastService.error('Failed to load schema');
            }
          }
          observer.next(schemaResponse);
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
    if (this.apiConfig.isGraphQL()) {
      return this.loadTableDataGraphQL(table, page, limit, searchQuery, options);
    }
    return this.loadTableDataREST(table, page, limit, searchQuery, options);
  }

  private loadTableDataREST (
    table: TableMetadata,
    page: number,
    limit: number,
    searchQuery: string,
    options?: { refresh?: boolean; showToast?: boolean },
  ): Observable<ApiResponse<PaginatedResponse<Record<string, unknown>>>> {
    const url = API_ENDPOINTS.ADMIN.CRUD(table.category, table.name);
    const timestamp = options?.refresh !== false ? Date.now() : undefined;

    return new Observable((observer) => {
      this.api
        .get<PaginatedResponse<Record<string, unknown>>>(url, {
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

  private loadTableDataGraphQL (
    table: TableMetadata,
    page: number,
    limit: number,
    searchQuery: string,
    options?: { refresh?: boolean; showToast?: boolean },
  ): Observable<ApiResponse<PaginatedResponse<Record<string, unknown>>>> {
    const query = `
      query($category: String!, $name: String!, $page: String, $limit: String, $search: String, $_t: String) {
        adminGetTableData(category: $category, name: $name, page: $page, limit: $limit, search: $search, _t: $_t)
      }
    `;
    const variables = {
      category: table.category,
      name: table.name,
      page: page.toString(),
      limit: limit.toString(),
      search: searchQuery,
      _t: Date.now().toString(),
    };

    return new Observable((observer) => {
      this.api
        .graphql<{ adminGetTableData: PaginatedResponse<Record<string, unknown>> }>(
          this.GQL_URL,
          query,
          variables,
        )
        .subscribe({
          next: (res) => {
            const tableDataResponse: ApiResponse<PaginatedResponse<Record<string, unknown>>> = {
              success: res.success,
              data: res.data.adminGetTableData,
              message: res.message,
            };

            if (options?.showToast) {
              if (tableDataResponse.success) {
                this.toastService.success('Table data loaded successfully');
              } else {
                this.toastService.error('Failed to load table data');
              }
            }
            observer.next(tableDataResponse);
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
    if (this.apiConfig.isGraphQL()) {
      return this.updateRecordGraphQL(table, id, data);
    }
    return this.updateRecordREST(table, id, data);
  }

  private updateRecordREST (
    table: TableMetadata,
    id: number,
    data: Record<string, unknown>,
  ): Observable<ApiResponse<Record<string, unknown>>> {
    const url = `${API_ENDPOINTS.ADMIN.CRUD(table.category, table.name)}/${id}`;
    return this.api.put<Record<string, unknown>>(url, data);
  }

  private updateRecordGraphQL (
    table: TableMetadata,
    id: number,
    data: Record<string, unknown>,
  ): Observable<ApiResponse<Record<string, unknown>>> {
    const query = `
      mutation($category: String!, $name: String!, $id: String!, $data: JSONObject!) {
        adminUpdateRecord(category: $category, name: $name, id: $id, data: $data)
      }
    `;
    const variables = {
      category: table.category,
      name: table.name,
      id: id.toString(),
      data,
    };

    return this.api
      .graphql<{ adminUpdateRecord: Record<string, unknown> }>(this.GQL_URL, query, variables)
      .pipe(
        map((res) => ({
          success: res.success,
          data: res.data.adminUpdateRecord,
          message: res.message || '',
        })),
      );
  }

  deleteRecord (table: TableMetadata, id: number): Observable<ApiResponse<void>> {
    if (this.apiConfig.isGraphQL()) {
      return this.deleteRecordGraphQL(table, id);
    }
    return this.deleteRecordREST(table, id);
  }

  private deleteRecordREST (table: TableMetadata, id: number): Observable<ApiResponse<void>> {
    const url = `${API_ENDPOINTS.ADMIN.CRUD(table.category, table.name)}/${id}`;
    return this.api.delete<void>(url);
  }

  private deleteRecordGraphQL (table: TableMetadata, id: number): Observable<ApiResponse<void>> {
    const query = `
      mutation($category: String!, $name: String!, $id: String!) {
        adminDeleteRecord(category: $category, name: $name, id: $id)
      }
    `;
    const variables = {
      category: table.category,
      name: table.name,
      id: id.toString(),
    };

    return this.api
      .graphql<{ adminDeleteRecord: void }>(this.GQL_URL, query, variables)
      .pipe(
        map((res) => ({
          success: res.success,
          data: undefined as unknown as void,
          message: res.message || '',
        })),
      );
  }

  bulkDelete (
    table: TableMetadata,
    ids: number[],
  ): Observable<ApiResponse<{ deletedCount: number; message: string }>> {
    const url = `${API_ENDPOINTS.ADMIN.CRUD(table.category, table.name)}/bulk-delete`;
    return this.api.post<{ deletedCount: number; message: string }>(url, { ids });
  }

  bulkUpdate (operations: unknown[], wait = false): Observable<ApiResponse<unknown>> {
    if (this.apiConfig.isGraphQL()) {
      return this.bulkUpdateGraphQL(operations, wait);
    }
    return this.bulkUpdateREST(operations, wait);
  }

  private bulkUpdateREST (operations: unknown[], wait: boolean): Observable<ApiResponse<unknown>> {
    const url = `${API_ENDPOINTS.ADMIN.BULK_OPERATIONS}?wait=${wait}`;
    return this.api.post<unknown>(url, { operations });
  }

  private bulkUpdateGraphQL (operations: unknown[], wait: boolean): Observable<ApiResponse<unknown>> {
    const query = `
      mutation($operations: [JSONObject]!, $wait: Boolean) {
        adminExecuteBulk(operations: $operations, wait: $wait)
      }
    `;
    const variables = {
      operations,
      wait: !!wait,
    };

    return this.api
      .graphql<{ adminExecuteBulk: unknown }>(this.GQL_URL, query, variables)
      .pipe(
        map((res) => ({
          success: res.success,
          data: res.data.adminExecuteBulk,
          message: res.message || '',
        })),
      );
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
