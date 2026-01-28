import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { GlobalCacheService } from './global-cache.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

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
  private cacheService = inject(GlobalCacheService);

  private readonly SCHEMA_CACHE_TTL = 10 * 60 * 1000;
  private readonly TABLE_DATA_CACHE_TTL = 2 * 60 * 1000;

  loadSchema (): Observable<ApiResponse<Schema>> {
    const cacheKey = 'database-schema';

    return this.http.get<ApiResponse<Schema>>(API_ENDPOINTS.ADMIN.SCHEMA).pipe(
      tap((response) => {
        this.cacheService.set(cacheKey, response, this.SCHEMA_CACHE_TTL);
        localStorage.setItem('database-schema-cache', JSON.stringify(response));
        localStorage.setItem('database-schema-cache-time', Date.now().toString());
      }),
    );
  }

  loadTableData (
    table: TableMetadata,
    page: number,
    limit: number,
    searchQuery: string,
  ): Observable<ApiResponse<PaginatedResponse<Record<string, unknown>>>> {
    const cacheKey = `table-data-${table.category}-${table.name}-${page}-${limit}-${searchQuery}`;

    const url = API_ENDPOINTS.ADMIN.CRUD(table.category, table.name);
    return this.http
      .get<ApiResponse<PaginatedResponse<Record<string, unknown>>>>(url, {
        params: {
          page: page.toString(),
          limit: limit.toString(),
          search: searchQuery,
        },
      })
      .pipe(
        tap((response) => {
          if (!searchQuery) {
            this.cacheService.set(cacheKey, response, this.TABLE_DATA_CACHE_TTL);
          }
        }),
      );
  }

  updateRecord (
    table: TableMetadata,
    id: number,
    data: Record<string, unknown>,
  ): Observable<ApiResponse<Record<string, unknown>>> {
    const url = `${API_ENDPOINTS.ADMIN.CRUD(table.category, table.name)}/${id}`;
    return this.http.put<ApiResponse<Record<string, unknown>>>(url, data).pipe(
      tap(() => {
        this.invalidateTableCache(table);
      }),
    );
  }

  deleteRecord (table: TableMetadata, id: number): Observable<ApiResponse<void>> {
    const url = `${API_ENDPOINTS.ADMIN.CRUD(table.category, table.name)}/${id}`;
    return this.http.delete<ApiResponse<void>>(url).pipe(
      tap(() => {
        this.invalidateTableCache(table);
      }),
    );
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

  invalidateTableCache (table: TableMetadata): void {
    const cacheInfo = this.cacheService.getCacheInfo();
    const tablePrefix = `table-data-${table.category}-${table.name}`;

    cacheInfo.forEach(({ key }) => {
      if (key.startsWith(tablePrefix)) {
        this.cacheService.delete(key);
      }
    });
  }

  invalidateAllCache (): void {
    this.cacheService.clear();
    localStorage.removeItem('database-schema-cache');
    localStorage.removeItem('database-schema-cache-time');
  }

  hasValidSchemaCache (): boolean {
    return this.cacheService.has('database-schema');
  }

  bulkDelete (
    table: TableMetadata,
    ids: number[],
  ): Observable<ApiResponse<{ deletedCount: number; message: string }>> {
    const url = `${API_ENDPOINTS.ADMIN.CRUD(table.category, table.name)}/bulk-delete`;
    return this.http
      .post<ApiResponse<{ deletedCount: number; message: string }>>(url, { ids })
      .pipe(
        tap(() => {
          this.invalidateTableCache(table);
        }),
      );
  }
}
