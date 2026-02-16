import { Injectable, inject } from '@angular/core';
import { DateFormatService } from './date-format.service';
import { TextTransformService } from './text-transform.service';
import { TableStyleService } from './table-style.service';
import { RoleAccessService } from './role-access.service';
import { FieldConfigService } from './field-config.service';
import { Column } from './database-operations.service';

@Injectable({
  providedIn: 'root',
})
export class DatabaseFormattingService {
  private dateFormat = inject(DateFormatService);
  private textTransform = inject(TextTransformService);
  private tableStyle = inject(TableStyleService);
  private roleAccess = inject(RoleAccessService);
  private fieldConfig = inject(FieldConfigService);

  formatValue (value: unknown, column: Column): string {
    if (value === null || value === undefined) return '-';

    if (this.fieldConfig.isRoleField(column.name) && typeof value === 'string') {
      return this.roleAccess.getRoleDisplayName(value);
    }

    if (column.type === 'datetime') {
      return this.dateFormat.formatForTable(value as string);
    }

    if (column.type === 'boolean') return value ? 'ACTIVE' : 'INACTIVE';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value as string | number | boolean);
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
        return this.roleAccess.getRoleDisplayName(value);
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

  getBooleanValue (row: Record<string, unknown>, columnName: string, draftData: Record<string, unknown> | null): boolean {
    if (draftData && columnName in draftData) {
      return draftData[columnName] as boolean;
    }
    return row[columnName] as boolean;
  }

  getNumberValue (row: Record<string, unknown>, columnName: string): number {
    return row[columnName] as number;
  }

  isImageUrl (colName: string): boolean {
    return this.fieldConfig.isImageField(colName);
  }
}
