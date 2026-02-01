import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { DateFormatService } from './date-format.service';
import { TextTransformService } from './text-transform.service';
import { TableStyleService } from './table-style.service';
import { ToastService } from './toast.service';
import { DatabaseDraftService } from './database-draft.service';
import { UserRoleHelper } from '../enums/user-roles.enum';
import { Column, TableMetadata } from './database-operations.service';

@Injectable({
  providedIn: 'root',
})
export class DatabaseHelperService {
  private authService = inject(AuthService);
  private dateFormat = inject(DateFormatService);
  private textTransform = inject(TextTransformService);
  private tableStyle = inject(TableStyleService);
  private toastService = inject(ToastService);
  private draftService = inject(DatabaseDraftService);

  formatValue (value: unknown, column: Column): string {
    if (value === null || value === undefined) return '-';

    if (this.isRoleColumn(column.name) && typeof value === 'string') {
      return UserRoleHelper.getRoleDisplayName(value);
    }

    if (column.type === 'datetime') {
      return this.dateFormat.formatForTable(value as string);
    }

    if (column.type === 'boolean') return value ? 'ACTIVE' : 'INACTIVE';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value as string | number | boolean);
  }

  private isRoleColumn (columnName: string): boolean {
    const roleColumnNames = [
      'role',
      'user_role',
      'userRole',
      'account_role',
      'accountRole',
      'permission_level',
      'permissionLevel',
    ];

    return roleColumnNames.some((roleName) =>
      columnName.toLowerCase().includes(roleName.toLowerCase()),
    );
  }

  getBooleanValue (row: Record<string, unknown>, columnName: string, draftData: Record<string, unknown> | null): boolean {
    if (draftData && columnName in draftData) {
      return draftData[columnName] as boolean;
    }
    return row[columnName] as boolean;
  }

  getNumberValue (row: Record<string, unknown>, columnName: string): number {
    return row[columnName] as number;
  }

  getFieldDisplayName (fieldName: string): string {
    return this.textTransform.getDisplayName(fieldName);
  }

  getHeaderClasses (columnName: string, columnType: string): string {
    return this.tableStyle.getHeaderClasses(columnName, columnType);
  }

  getCellClasses (columnName: string, columnType: string): string {
    return this.tableStyle.getCellClasses(columnName, columnType);
  }

  getColumnStyles (columnName: string, columnType: string): Record<string, string> {
    return this.tableStyle.getColumnStyles(columnName, columnType);
  }

  isImageUrl (colName: string): boolean {
    return colName.toLowerCase().includes('image') || colName.toLowerCase().includes('avatar');
  }

  getAvailableRoles (): { value: string; label: string }[] {
    return [
      { value: 'global admin', label: 'Global Administrator' },
      { value: 'admin', label: 'Administrator' },
      { value: 'moderator', label: 'Moderator' },
      { value: 'user', label: 'User' },
    ];
  }

  getUserInitials (row: Record<string, unknown>): string {
    const firstName = (row['firstName'] as string) || (row['first_name'] as string) || '';
    const lastName = (row['lastName'] as string) || (row['last_name'] as string) || '';

    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }

    const email = (row['email'] as string) || '';
    if (email) {
      return email.charAt(0).toUpperCase();
    }

    return 'U';
  }

  formatFieldValue (value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '(empty)';
    }
    if (typeof value === 'boolean') {
      return value ? 'Active' : 'Inactive';
    }
    if (typeof value === 'string') {
      if (value.includes('admin')) {
        return UserRoleHelper.getRoleDisplayName(value);
      }
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.formatFieldValue(item)).join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      if (value.toString !== Object.prototype.toString) {
        return (value as { toString(): string }).toString();
      }
      const obj = value as Record<string, unknown>;
      const searchableProps = ['name', 'title', 'label', 'value', 'text', 'description'];
      for (const prop of searchableProps) {
        if (prop in obj && typeof obj[prop] === 'string') {
          return obj[prop];
        }
      }
      return JSON.stringify(value);
    }
    return 'Unknown';
  }

  canDeleteRecord (): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? UserRoleHelper.isGlobalAdmin(currentUser.role) : false;
  }

  hasAnyActions (table: TableMetadata | null): boolean {
    if (!table) return false;

    const actions = table.actions || { create: true, update: true, delete: true };
    return actions.update !== false || actions.delete !== false;
  }

  canModifySensitiveFields (): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? UserRoleHelper.isGlobalAdmin(currentUser.role) : false;
  }

  isSensitiveField (columnName: string): boolean {
    const sensitiveFields = ['isActive', 'isEmailVerified'];
    return sensitiveFields.includes(columnName);
  }

  // Merged from database-ui.service.ts
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
      error: () => {
        isPublishing(false);
        this.toastService.error('Failed to publish changes');
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