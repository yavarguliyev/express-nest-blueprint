import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DatabaseOperationStrategy } from '../../interfaces/database-strategy.interface';
import { API_ENDPOINTS } from '../../constants/api.constants';
import { Schema, TableMetadata, DatabaseOperation, BulkOperationRequest, BulkOperationResponse } from '../../interfaces/database.interface';
import { ApiResponse, PaginatedResponse } from '../../interfaces/common.interface';

@Injectable({
  providedIn: 'root'
})
export class RestDatabaseStrategy implements DatabaseOperationStrategy {
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
        t: new Date().getTime().toString()
      }
    });
  }

  bulkUpdate (operations: DatabaseOperation[], wait = false): Observable<ApiResponse<BulkOperationResponse>> {
    const url = `${API_ENDPOINTS.ADMIN.BULK_OPERATIONS}${wait ? '?wait=true' : ''}`;
    const request: BulkOperationRequest = { operations };
    return this.http.post<ApiResponse<BulkOperationResponse>>(url, request);
  }
}
