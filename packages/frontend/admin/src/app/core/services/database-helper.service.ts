import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { DatabaseDraftService } from './database-draft.service';
import { DatabaseFormattingService } from './database-formatting.service';
import { DatabaseBusinessService } from './database-business.service';
import { NotificationUtil } from '../utils/notification.util';
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
      NotificationUtil.noChangesToPublish(this.toastService);
      return;
    }
    isPublishing(true);
    this.draftService.publishDrafts().subscribe({
      next: (response) => {
        isPublishing(false);
        if (response.success) {
          NotificationUtil.changesPublished(this.toastService, response.summary.successful);
          loadTableData();
        } else {
          NotificationUtil.publishPartialSuccess(this.toastService, response.summary.successful, response.summary.failed);
        }
      },
      error: (error: unknown) => {
        isPublishing(false);
        NotificationUtil.operationError(this.toastService, 'publish changes', error);
      },
    });
  }

  resetAllChanges (hasDrafts: boolean, draftCount: number, loadTableData: () => void): void {
    if (!hasDrafts) {
      NotificationUtil.noChangesToReset(this.toastService);
      return;
    }
    NotificationUtil.confirmReset(this.toastService, () => {
      this.draftService.resetDrafts();
      loadTableData();
      NotificationUtil.changesReset(this.toastService);
    }, draftCount);
  }

  handleImageClick (imageUrl: string): void {
    if (imageUrl?.trim()) {
      window.open(imageUrl, '_blank');
    } else {
      NotificationUtil.notAvailable(this.toastService, 'image');
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
