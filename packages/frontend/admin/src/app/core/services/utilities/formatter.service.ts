import { Injectable, inject } from '@angular/core';
import { DateFormatService } from './date-format.service';
import { TextTransformService } from './text-transform.service';
import { UserRoleHelper } from './user-role-utility.service';
import { ROLE_COLUMN_NAMES } from '../../constants/field.constants';
import { Column } from '../../interfaces/database.interface';

@Injectable({
  providedIn: 'root'
})
export class FormatterService {
  private dateFormat = inject(DateFormatService);
  private textTransform = inject(TextTransformService);

  formatValue (value: unknown, column: Column): string {
    if (value === null || value === undefined) return '-';

    if (this.isRoleColumn(column.name) && typeof value === 'string') {
      return this.formatRole(value);
    }

    if (column.type === 'datetime') {
      return this.dateFormat.formatForTable(value as string);
    }

    if (column.type === 'boolean') {
      return value ? 'ACTIVE' : 'INACTIVE';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return '-';
  }

  formatFieldValue (value: unknown): string {
    if (this.isEmpty(value)) return '(empty)';
    if (typeof value === 'boolean') return value ? 'Active' : 'Inactive';
    if (typeof value === 'string') return this.formatStringValue(value);
    if (typeof value === 'number') return String(value);
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(item => this.formatFieldValue(item)).join(', ');
    if (typeof value === 'object' && value !== null) return JSON.stringify(value);
    return 'Unknown';
  }

  getFieldDisplayName (fieldName: string): string {
    return this.textTransform.getDisplayName(fieldName);
  }

  private isEmpty (value: unknown): boolean {
    return value === null || value === undefined || value === '';
  }

  private isRoleColumn (columnName: string): boolean {
    return ROLE_COLUMN_NAMES.some(roleName => columnName.toLowerCase().includes(roleName.toLowerCase()));
  }

  private formatRole (role: string): string {
    return UserRoleHelper.getRoleDisplayName(role);
  }

  private formatStringValue (value: string): string {
    if (value.includes('admin')) {
      return this.formatRole(value);
    }
    return value;
  }
}
