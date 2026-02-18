import { Injectable, inject } from '@angular/core';

import { UserUtilityService } from '../utilities/user-utility.service';
import { TableMetadata } from '../../interfaces/database.interface';
import { EXCLUDED_FIELDS, DISABLED_FIELDS, SENSITIVE_FIELDS } from '../../constants/field.constants';

@Injectable({
  providedIn: 'root'
})
export class FieldAccessService {
  private userUtility = inject(UserUtilityService);

  isFieldExcludedFromUpdate (columnName: string, selectedRecord?: Record<string, unknown> | null): boolean {
    if (EXCLUDED_FIELDS.includes(columnName as (typeof EXCLUDED_FIELDS)[number])) return true;
    if (columnName === 'role') return this.isRoleExcluded(selectedRecord);
    return false;
  }

  isFieldDisabled (columnName: string, table: TableMetadata | null, mode: 'create' | 'update' = 'update'): boolean {
    if (mode === 'create' && columnName === 'email' && this.hasEmailColumn(table)) return false;
    return DISABLED_FIELDS.includes(columnName as (typeof DISABLED_FIELDS)[number]);
  }

  isSensitiveField (columnName: string): boolean {
    return SENSITIVE_FIELDS.includes(columnName as (typeof SENSITIVE_FIELDS)[number]);
  }

  canModifyField (columnName: string): boolean {
    if (!this.isSensitiveField(columnName)) return true;
    return this.userUtility.canModifySensitiveFields();
  }

  private isRoleExcluded (selectedRecord?: Record<string, unknown> | null): boolean {
    if (!this.userUtility.canEditRoles()) return true;

    if (selectedRecord) {
      const recordId = selectedRecord['id'] as number;
      return this.userUtility.isCurrentUser(recordId);
    }

    return false;
  }

  private hasEmailColumn (table: TableMetadata | null): boolean {
    return table?.columns.some(c => c.name === 'email') || false;
  }
}
