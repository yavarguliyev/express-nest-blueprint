import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { DatabaseOperationStrategy } from '../../interfaces/database-strategy.interface';
import { API_ENDPOINTS } from '../../constants/api.constants';
import { Schema, TableMetadata, DatabaseOperation, BulkOperationResponse, GqlResponse } from '../../interfaces/database.interface';
import { ApiResponse, PaginatedResponse } from '../../interfaces/common.interface';

@Injectable({
  providedIn: 'root'
})
export class GraphQLDatabaseStrategy implements DatabaseOperationStrategy {
  private http = inject(HttpClient);
  private readonly GQL_URL = API_ENDPOINTS.ADMIN.GRAPHQL;

  loadSchema (): Observable<ApiResponse<Schema>> {
    const query = `
      query {
        adminGetSchema
      }
    `;

    return this.executeQuery<{ adminGetSchema: Schema }>(query).pipe(
      map(res => ({
        success: !res.errors,
        data: res.data?.adminGetSchema as Schema,
        message: res.errors?.[0]?.message ?? ''
      }))
    );
  }

  loadTableData (
    table: TableMetadata,
    page: number,
    limit: number,
    searchQuery: string
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
      _t: Date.now().toString()
    };

    return this.executeQuery<{ adminGetTableData: PaginatedResponse<Record<string, unknown>> }>(query, variables).pipe(
      map(res => ({
        success: !res.errors,
        data: res.data?.adminGetTableData as PaginatedResponse<Record<string, unknown>>,
        message: res.errors?.[0]?.message ?? ''
      }))
    );
  }

  bulkUpdate (operations: DatabaseOperation[], wait = false): Observable<ApiResponse<BulkOperationResponse>> {
    const query = `
      mutation($operations: [JSONObject]!, $wait: Boolean) {
        adminExecuteBulk(operations: $operations, wait: $wait)
      }
    `;

    const variables = {
      operations,
      wait: !!wait
    };

    return this.executeQuery<{ adminExecuteBulk: BulkOperationResponse }>(query, variables).pipe(
      map(res => ({
        success: !res.errors,
        data: res.data?.adminExecuteBulk as BulkOperationResponse,
        message: res.errors?.[0]?.message ?? ''
      }))
    );
  }

  private executeQuery<T> (query: string, variables?: Record<string, unknown>): Observable<GqlResponse<T>> {
    return this.http.post<GqlResponse<T>>(this.GQL_URL, { query, variables });
  }
}
