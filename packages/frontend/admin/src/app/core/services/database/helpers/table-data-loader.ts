import { signal } from '@angular/core';

import { TableMetadata } from '../../../interfaces/database.interface';
import { DatabaseFacadeService } from '../database-facade.service';
import { ToastService } from '../../ui/toast.service';

export class TableDataLoader {
  loadingData = signal(false);
  tableData = signal<Record<string, unknown>[]>([]);
  total = signal(0);

  constructor (
    private dbFacade: DatabaseFacadeService,
    private toastService: ToastService
  ) {}

  loadData (table: TableMetadata, page: number, limit: number, searchQuery: string, onComplete?: () => void): void {
    this.loadingData.set(true);
    this.dbFacade.loadTableData(table, page, limit, searchQuery).subscribe({
      next: res => {
        this.processResponse(res.data);
        this.loadingData.set(false);
        if (onComplete) onComplete();
      },
      error: () => {
        this.toastService.error(`Failed to load ${table.name} data.`);
        this.loadingData.set(false);
      }
    });
  }

  refreshData (table: TableMetadata, page: number, limit: number, searchQuery: string): void {
    this.loadingData.set(true);
    this.dbFacade.loadTableData(table, page, limit, searchQuery).subscribe({
      next: res => {
        if (res.success) {
          this.processResponse(res.data);
          this.toastService.success('Table data refreshed successfully');
        } else {
          this.toastService.error(res.message || `Failed to refresh ${table.name} data.`);
        }
        this.loadingData.set(false);
      },
      error: () => {
        this.loadingData.set(false);
      }
    });
  }

  private processResponse (responseData: { data?: Record<string, unknown>[]; total?: number }): void {
    if (responseData?.data) {
      this.tableData.set(responseData.data);
      this.total.set(responseData.total || responseData.data.length);
    } else {
      this.tableData.set([]);
      this.total.set(0);
    }
  }
}
