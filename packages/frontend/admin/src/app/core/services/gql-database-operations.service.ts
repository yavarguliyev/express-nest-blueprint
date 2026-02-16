import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  Schema,
  PaginatedResponse,
  ApiResponse,
  TableMetadata,
  DatabaseOperation,
} from './database-operations.service';

export interface GqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

@Injectable({
  providedIn: 'root',
})
export class GqlDatabaseOperationsService {
  private http = inject(HttpClient);
  private readonly GQL_URL = '/admin/graphql';

  loadSchema (): Observable<ApiResponse<Schema>> {
    const query = `
      query {
        adminGetSchema
      }
    `;
    return this.http.post<GqlResponse<{ adminGetSchema: Schema }>>(this.GQL_URL, { query }).pipe(
      map((res) => ({
        success: !res.errors,
        data: res.data?.adminGetSchema as Schema,
        message: res.errors?.[0]?.message ?? '',
      })),
    );
  }

  loadTableData (
    table: TableMetadata,
    page: number,
    limit: number,
    searchQuery: string,
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

    return this.http
      .post<
        GqlResponse<{ adminGetTableData: PaginatedResponse<Record<string, unknown>> }>
      >(this.GQL_URL, { query, variables })
      .pipe(
        map((res) => ({
          success: !res.errors,
          data: res.data?.adminGetTableData as PaginatedResponse<Record<string, unknown>>,
          message: res.errors?.[0]?.message ?? '',
        })),
      );
  }

  updateRecord (
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

    return this.http
      .post<
        GqlResponse<{ adminUpdateRecord: Record<string, unknown> }>
      >(this.GQL_URL, { query, variables })
      .pipe(
        map((res) => ({
          success: !res.errors,
          data: res.data?.adminUpdateRecord as Record<string, unknown>,
          message: res.errors?.[0]?.message ?? '',
        })),
      );
  }

  deleteRecord (table: TableMetadata, id: number): Observable<ApiResponse<void>> {
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

    return this.http
      .post<GqlResponse<{ adminDeleteRecord: void }>>(this.GQL_URL, { query, variables })
      .pipe(
        map((res) => ({
          success: !res.errors,
          data: undefined as unknown as void,
          message: res.errors?.[0]?.message ?? '',
        })),
      );
  }

  bulkUpdate (operations: DatabaseOperation[], wait = false): Observable<ApiResponse<unknown>> {
    const query = `
      mutation($operations: [JSONObject]!, $wait: Boolean) {
        adminExecuteBulk(operations: $operations, wait: $wait)
      }
    `;
    const variables = {
      operations,
      wait: !!wait,
    };

    return this.http
      .post<GqlResponse<{ adminExecuteBulk: unknown }>>(this.GQL_URL, { query, variables })
      .pipe(
        map((res) => ({
          success: !res.errors,
          data: res.data?.adminExecuteBulk,
          message: res.errors?.[0]?.message ?? '',
        })),
      );
  }
}
