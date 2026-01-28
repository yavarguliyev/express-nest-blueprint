import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastService } from './toast.service';
import {
  DatabaseOperationsService,
  TableMetadata,
  Schema,
} from './database-operations.service';

@Injectable({
  providedIn: 'root',
})
export class DatabaseCacheService {
  private toastService = inject(ToastService);
  private dbOperations = inject(DatabaseOperationsService);

  loadSchemaWithCache (): Observable<{ success: boolean; data: Schema }> {
    return this.dbOperations.loadSchema();
  }

  refreshSchemaWithToast (): Observable<{ success: boolean; data: Schema }> {
    return new Observable((observer) => {
      this.dbOperations.refreshSchema().subscribe({
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
    searchQuery: string
  ): Observable<{ success: boolean; data: { data: Record<string, unknown>[]; total: number } }> {
    return new Observable((observer) => {
      this.dbOperations.refreshTableData(table, page, limit, searchQuery).subscribe({
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
    searchQuery: string
  ): Observable<{ success: boolean; data: { data: Record<string, unknown>[]; total: number } }> {
    return this.dbOperations.loadTableData(table, page, limit, searchQuery);
  }
}