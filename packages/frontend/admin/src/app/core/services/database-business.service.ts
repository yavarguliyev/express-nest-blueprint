import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { UserRoleHelper } from '../enums/user-roles.enum';
import { TableMetadata } from './database-operations.service';

@Injectable({
  providedIn: 'root',
})
export class DatabaseBusinessService {
  private authService = inject(AuthService);

  canDeleteRecord (): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? UserRoleHelper.isGlobalAdmin(currentUser.role) : false;
  }

  canModifySensitiveFields (): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? UserRoleHelper.isGlobalAdmin(currentUser.role) : false;
  }

  hasAnyActions (table: TableMetadata | null): boolean {
    if (!table) return false;

    const actions = table.actions || { create: true, update: true, delete: true };
    return actions.update !== false || actions.delete !== false;
  }

  isSensitiveField (columnName: string): boolean {
    const sensitiveFields = ['isActive', 'isEmailVerified'];
    return sensitiveFields.includes(columnName);
  }

  getAvailableRoles (): { value: string; label: string }[] {
    return [
      { value: 'global admin', label: 'Global Administrator' },
      { value: 'admin', label: 'Administrator' },
      { value: 'moderator', label: 'Moderator' },
      { value: 'user', label: 'User' },
    ];
  }
}
