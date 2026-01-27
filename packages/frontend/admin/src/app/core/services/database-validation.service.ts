import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { UserRoleHelper } from '../enums/user-roles.enum';
import { TableMetadata } from './database-operations.service';

@Injectable({
  providedIn: 'root',
})
export class DatabaseValidationService {
  private authService = inject(AuthService);

  isCurrentUser (id: number): boolean {
    const user = this.authService.getCurrentUser();
    return user ? String(user.id) === String(id) : false;
  }

  isRestrictedTable (table: TableMetadata | null): boolean {
    return table?.tableName === 'users';
  }

  isFieldRestricted (_id: number, _colName: string): boolean {
    void _id;
    void _colName;
    return false;
  }

  isFieldExcludedFromUpdate (columnName: string, selectedRecord: Record<string, unknown> | null): boolean {
    const excludedFields = ['id', 'isActive', 'isEmailVerified', 'profileImageUrl'];

    const currentUser = this.authService.getCurrentUser();

    if (columnName === 'role' && currentUser) {
      if (!UserRoleHelper.canEditRoles(currentUser.role)) {
        excludedFields.push('role');
      } else if (selectedRecord && this.isCurrentUser(selectedRecord['id'] as number)) {
        excludedFields.push('role');
      }
    }

    return excludedFields.includes(columnName);
  }

  isFieldDisabled (columnName: string): boolean {
    const disabledFields = ['email'];
    return disabledFields.includes(columnName);
  }

  canDeleteRecord (record: Record<string, unknown>, table: TableMetadata | null): boolean {
    if (!table) return false;
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    if (table.tableName === 'users') {
      const recordId = record['id'] as number;
      if (this.isCurrentUser(recordId)) {
        return false;
      }
      return UserRoleHelper.isGlobalAdmin(currentUser.role);
    }

    return true;
  }

  validateFormData (formData: Record<string, unknown>, columns: Array<{ name: string; required: boolean }>): string[] {
    const errors: string[] = [];

    for (const column of columns) {
      if (column.required) {
        const value = formData[column.name];
        if (value === null || value === undefined || value === '') {
          errors.push(`${column.name} is required`);
        }
      }
    }

    return errors;
  }
}