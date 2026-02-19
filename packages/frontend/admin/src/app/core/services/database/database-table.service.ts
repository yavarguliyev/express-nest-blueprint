import { Injectable, inject, signal, computed, ElementRef } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { TableMetadata, Schema } from '../../interfaces/database.interface';
import { DatabaseFacadeService } from './database-facade.service';
import { ToastService } from '../ui/toast.service';
import { PaginationService } from '../ui/pagination.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseTableService {
  private dbFacade = inject(DatabaseFacadeService);
  private toastService = inject(ToastService);
  private pagination = inject(PaginationService);
  private searchSubject = new Subject<string>();

  useGraphQL = signal(false);
  schema = signal<Schema | null>(null);
  loadingSchema = signal(true);
  loadingData = signal(false);
  expandedCategories = signal<{ [key: string]: boolean }>({});
  selectedTable = signal<TableMetadata | null>(null);
  tableData = signal<Record<string, unknown>[]>([]);
  total = signal(0);
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
    this.loadingData.set(true);

    this.dbFacade.loadTableData(table, this.page(), this.limit, this.searchQuery()).subscribe({
      next: res => {
        const responseData = res.data;
        if (responseData?.data) {
          this.tableData.set(responseData.data);
          this.total.set(responseData.total || responseData.data.length);
        } else {
          this.tableData.set([]);
          this.total.set(0);
        }

        this.loadingData.set(false);
        if (onComplete) onComplete();
      },
      error: () => {
        this.toastService.error(`Failed to load ${table.name} data.`);
        this.loadingData.set(false);
      }
    });
  }

  refreshTableData (): void {
    const table = this.selectedTable();
    if (!table) return;
    this.loadingData.set(true);

    this.dbFacade.loadTableData(table, this.page(), this.limit, this.searchQuery()).subscribe({
      next: res => {
        if (res.success) {
          const responseData = res.data;
          if (responseData?.data) {
            this.tableData.set(responseData.data);
            this.total.set(responseData.total || responseData.data.length);
          } else {
            this.tableData.set([]);
            this.total.set(0);
          }

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
    if (!container) return;

    const element = container.nativeElement;
    const updateScrollIndicators = (): void => {
      const { scrollLeft, scrollWidth, clientWidth } = element;
      element.classList.remove('scrolled-left', 'scrolled-right');
      if (scrollLeft > 0) element.classList.add('scrolled-left');
      if (scrollLeft < scrollWidth - clientWidth - 1) element.classList.add('scrolled-right');
    };

    setTimeout(updateScrollIndicators, 100);
    element.addEventListener('scroll', updateScrollIndicators);
    window.addEventListener('resize', updateScrollIndicators);
  }

  resetTableScroll (container: ElementRef<HTMLDivElement> | undefined): void {
    setTimeout(() => {
      if (container) {
        container.nativeElement.scrollLeft = 0;
      }
    }, 100);
  }
}
