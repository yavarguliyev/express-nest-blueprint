import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { DatabaseDraftService } from './database-draft.service';
import { DatabaseFormattingService } from './database-formatting.service';
import { DatabaseBusinessService } from './database-business.service';
import { Column, TableMetadata } from './database-operations.service';

@Injectable({
  providedIn: 'root',
})
export class DatabaseHelperService {
  private toastService = inject(ToastService);
  private draftService = inject(DatabaseDraftService);
  private formatting = inject(DatabaseFormattingService);
  private business = inject(DatabaseBusinessService);

  formatValue (value: unknown, column: Column): string {
    return this.formatting.formatValue(value, column);
  }

  formatFieldValue (value: unknown): string {
    return this.formatting.formatFieldValue(value);
  }

  getUserInitials (row: Record<string, unknown>): string {
    return this.formatting.getUserInitials(row);
  }

  getFieldDisplayName (fieldName: string): string {
    return this.formatting.getFieldDisplayName(fieldName);
  }

  getHeaderClasses (columnName: string, columnType: string): string {
    return this.formatting.getHeaderClasses(columnName, columnType);
  }

  getCellClasses (columnName: string, columnType: string): string {
    return this.formatting.getCellClasses(columnName, columnType);
  }

  getColumnStyles (columnName: string, columnType: string): Record<string, string> {
    return this.formatting.getColumnStyles(columnName, columnType);
  }

  getBooleanValue (row: Record<string, unknown>, columnName: string, draftData: Record<string, unknown> | null): boolean {
    return this.formatting.getBooleanValue(row, columnName, draftData);
  }

  getNumberValue (row: Record<string, unknown>, columnName: string): number {
    return this.formatting.getNumberValue(row, columnName);
  }

  isImageUrl (colName: string): boolean {
    return this.formatting.isImageUrl(colName);
  }

  canDeleteRecord (): boolean {
    return this.business.canDeleteRecord();
  }

  canModifySensitiveFields (): boolean {
    return this.business.canModifySensitiveFields();
  }

  hasAnyActions (table: TableMetadata | null): boolean {
    return this.business.hasAnyActions(table);
  }

  isSensitiveField (columnName: string): boolean {
    return this.business.isSensitiveField(columnName);
  }

  getAvailableRoles (): { value: string; label: string }[] {
    return this.business.getAvailableRoles();
  }

  publishAllChanges (hasDrafts: boolean, isPublishing: (value: boolean) => void, loadTableData: () => void): void {
    if (!hasDrafts) {
      this.toastService.info('No changes to publish');
      return;
    }
    isPublishing(true);
    this.draftService.publishDrafts().subscribe({
      next: (response) => {
        isPublishing(false);
        if (response.success) {
          this.toastService.success(`Successfully published ${response.summary.successful} changes`);
          loadTableData();
        } else {
          this.toastService.error(`Published ${response.summary.successful} changes, ${response.summary.failed} failed`);
        }
      },
      error: (error: unknown) => {
        const err = error as {
          error?: {
            message?: string;
          };
          message?: string;
        };

        isPublishing(false);
        this.toastService.error(err?.error?.message || err?.message || 'Failed to publish changes');
      },
    });
  }

  resetAllChanges (hasDrafts: boolean, draftCount: number, loadTableData: () => void): void {
    if (!hasDrafts) {
      this.toastService.info('No changes to reset');
      return;
    }
    this.toastService.confirm(`Reset all ${draftCount} unsaved changes? This cannot be undone.`, () => {
      this.draftService.resetDrafts();
      loadTableData();
      this.toastService.success('All changes have been reset');
    });
  }

  handleImageClick (imageUrl: string): void {
    if (imageUrl?.trim()) {
      window.open(imageUrl, '_blank');
    } else {
      this.toastService.info('No image available.');
    }
  }

  setupScrollIndicators (container: HTMLDivElement): void {
    const updateScrollIndicators = (): void => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      container.classList.remove('scrolled-left', 'scrolled-right');
      if (scrollLeft > 0) container.classList.add('scrolled-left');
      if (scrollLeft < scrollWidth - clientWidth - 1) container.classList.add('scrolled-right');
    };
    setTimeout(updateScrollIndicators, 100);
    container.addEventListener('scroll', updateScrollIndicators);
    window.addEventListener('resize', updateScrollIndicators);
  }
}
