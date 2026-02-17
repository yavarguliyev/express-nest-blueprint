import { Injectable, inject } from '@angular/core';
import { RoleAccessService } from './role-access.service';
import { FieldConfigService } from './field-config.service';
import { TableMetadata } from '../interfaces/database.interface';

@Injectable({
  providedIn: 'root'
})
export class DatabaseBusinessService {
  private roleAccess = inject(RoleAccessService);
  private fieldConfig = inject(FieldConfigService);

  canDeleteRecord (): boolean {
    return this.roleAccess.canDeleteRecords();
  }

  canModifySensitiveFields (): boolean {
    return this.roleAccess.canModifySensitiveFields();
  }

  hasAnyActions (table: TableMetadata | null): boolean {
    if (!table) return false;

    const actions = table.actions || { create: true, update: true, delete: true };
    return actions.update !== false || actions.delete !== false;
  }

  isSensitiveField (columnName: string): boolean {
    return this.fieldConfig.isSensitiveField(columnName);
  }

  getAvailableRoles (): { value: string; label: string }[] {
    return this.roleAccess.getAvailableRoles();
  }
}
