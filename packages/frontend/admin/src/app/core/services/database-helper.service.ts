import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { DateFormatService } from './date-format.service';
import { TextTransformService } from './text-transform.service';
import { TableStyleService } from './table-style.service';
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
}