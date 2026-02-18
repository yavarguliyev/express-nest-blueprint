import { Observable } from 'rxjs';

import { Schema, TableMetadata, DatabaseOperation, BulkOperationResponse } from './database.interface';
import { ApiResponse, PaginatedResponse } from './common.interface';

export interface DatabaseOperationStrategy {
  loadSchema(): Observable<ApiResponse<Schema>>;
  bulkUpdate(operations: DatabaseOperation[], wait?: boolean): Observable<ApiResponse<BulkOperationResponse>>;

  loadTableData(
    table: TableMetadata,
    page: number,
    limit: number,
    searchQuery: string
  ): Observable<ApiResponse<PaginatedResponse<Record<string, unknown>>>>;
}
