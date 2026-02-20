import { Injectable, inject, signal, computed, ElementRef } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { TableMetadata, Schema } from '../../interfaces/database.interface';
import { DatabaseFacadeService } from './database-facade.service';
import { ToastService } from '../ui/toast.service';
import { PaginationService } from '../ui/pagination.service';
import { TableDataLoader } from './helpers/table-data-loader';
import { ScrollManager } from './helpers/scroll-manager';

@Injectable({
  providedIn: 'root'
})
export class DatabaseTableService {
  private dbFacade = inject(DatabaseFacadeService);
  private toastService = inject(ToastService);
  private pagination = inject(PaginationService);
  private searchSubject = new Subject<string>();
  private dataLoader = new TableDataLoader(this.dbFacade, this.toastService);
  private scrollManager = new ScrollManager();

  useGraphQL = signal(false);
  schema = signal<Schema | null>(null);
  loadingSchema = signal(true);
  expandedCategories = signal<{ [key: string]: boolean }>({});
  selectedTable = signal<TableMetadata | null>(null);
  page = signal(1);
  limit = 10;
  searchQuery = signal('');

  totalPages = computed(() => this.pagination.calculateTotalPages(this.total(), this.limit));
  pages = computed(() => this.pagination.generatePageNumbers(this.page(), this.totalPages()));

  constructor () {
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(query => {
      this.searchQuery.set(query);
      this.page.set(1);
      this.loadTableData();
    });
  }

  get loadingData (): typeof this.dataLoader.loadingData {
    return this.dataLoader.loadingData;
  }

  get tableData (): typeof this.dataLoader.tableData {
    return this.dataLoader.tableData;
  }

  get total (): typeof this.dataLoader.total {
    return this.dataLoader.total;
  }

  loadSchema (isRefresh = false): void {
    this.loadingSchema.set(true);
    this.dbFacade.loadSchema().subscribe({
      next: res => {
        if (isRefresh && !res.success) this.toastService.error(res.message || 'Failed to refresh schema');
        else {
          this.schema.set(res.data);
          if (isRefresh) this.toastService.success('Schema refreshed successfully');
        }

        this.loadingSchema.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load database schema.');
        this.loadingSchema.set(false);
      }
    });
  }

  onGraphQLToggle (useGraphQL: boolean): void {
    this.useGraphQL.set(useGraphQL);
    this.dbFacade.setStrategy(useGraphQL);
    this.loadSchema(true);
  }

  toggleCategory (category: string): void {
    this.expandedCategories.update(prev => ({ ...prev, [category]: !prev[category] }));
  }

  selectTable (table: TableMetadata): void {
    if (this.selectedTable()?.name === table.name) {
      this.selectedTable.set(null);
      this.tableData.set([]);
      return;
    }

    this.selectedTable.set(table);
    this.page.set(1);
    this.loadTableData();
  }

  loadTableData (onComplete?: () => void): void {
    const table = this.selectedTable();
    if (!table) return;
    this.dataLoader.loadData(table, this.page(), this.limit, this.searchQuery(), onComplete);
  }

  refreshTableData (): void {
    const table = this.selectedTable();
    if (!table) return;
    this.dataLoader.refreshData(table, this.page(), this.limit, this.searchQuery());
  }

  onSearch (event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  changePage (newPage: number): void {
    if (!this.pagination.isValidPageChange(newPage, this.totalPages())) return;
    this.page.set(newPage);
    this.loadTableData();
  }

  setupScrollIndicators (container: ElementRef<HTMLDivElement>): void {
    this.scrollManager.setupScrollIndicators(container);
  }

  resetTableScroll (container: ElementRef<HTMLDivElement> | undefined): void {
    this.scrollManager.resetTableScroll(container);
  }
}
