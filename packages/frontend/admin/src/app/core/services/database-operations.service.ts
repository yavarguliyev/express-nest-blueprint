import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  loadSchema (): Observable<ApiResponse<Schema>> {
    return this.http.get<ApiResponse<Schema>>(API_ENDPOINTS.ADMIN.SCHEMA);
  }

  loadTableData (
    table: TableMetadata,
    page: number,
    limit: number,
    searchQuery: string
  ): Observable<ApiResponse<PaginatedResponse<Record<string, unknown>>>> {
    const url = API_ENDPOINTS.ADMIN.CRUD(table.category, table.name);
    return this.http.get<ApiResponse<PaginatedResponse<Record<string, unknown>>>>(url, {
      params: {
        page: page.toString(),
        limit: limit.toString(),
        search: searchQuery,
      },
    });
  }

  updateRecord (
    table: TableMetadata,
    id: number,
    data: Record<string, unknown>
  ): Observable<ApiResponse<Record<string, unknown>>> {
    const url = `${API_ENDPOINTS.ADMIN.CRUD(table.category, table.name)}/${id}`;
    return this.http.put<ApiResponse<Record<string, unknown>>>(url, data);
  }

  deleteRecord (
    table: TableMetadata,
    id: number
  ): Observable<ApiResponse<{ message: string }>> {
    const url = `${API_ENDPOINTS.ADMIN.CRUD(table.category, table.name)}/${id}`;
    return this.http.delete<ApiResponse<{ message: string }>>(url);
  }

  bulkDelete (
    table: TableMetadata,
    ids: number[]
  ): Observable<ApiResponse<{ deletedCount: number; message: string }>> {
    const url = `${API_ENDPOINTS.ADMIN.CRUD(table.category, table.name)}/bulk-delete`;
    return this.http.post<ApiResponse<{ deletedCount: number; message: string }>>(url, { ids });
  }
}