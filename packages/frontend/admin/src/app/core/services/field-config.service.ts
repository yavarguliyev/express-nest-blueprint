import { Injectable, inject } from '@angular/core';
import { RoleAccessService } from './role-access.service';
import { FieldRule } from '../interfaces/field-config.interface';

@Injectable({
  providedIn: 'root',
})
export class FieldConfigService {
  private roleAccess = inject(RoleAccessService);

  private readonly excludedFromUpdate: string[] = [
    'id',
    'profileImageUrl',
    'createdAt',
    'updatedAt',
    'lastLogin',
  ];

  private readonly sensitiveFields: string[] = ['isActive', 'isEmailVerified'];

  private readonly roleFields: string[] = [
    'role',
    'user_role',
    'userRole',
    'account_role',
    'accountRole',
    'permission_level',
    'permissionLevel',
  ];

  private readonly imageFields: string[] = [
    'image',
    'avatar',
    'profileImageUrl',
    'avatarUrl',
    'imageUrl',
  ];

  isExcludedFromUpdate (fieldName: string, currentUserId?: number, recordUserId?: number): boolean {
    if (this.excludedFromUpdate.includes(fieldName)) {
      return true;
    }

    if (this.isRoleField(fieldName)) {
      if (!this.roleAccess.canEditRoles()) {
        return true;
      }

      if (currentUserId && recordUserId && currentUserId === recordUserId) {
        return true;
      }
    }

    return false;
  }

  isSensitiveField (fieldName: string): boolean {
    return this.sensitiveFields.includes(fieldName);
  }

  isRoleField (fieldName: string): boolean {
    return this.roleFields.some((roleField) =>
      fieldName.toLowerCase().includes(roleField.toLowerCase()),
    );
  }

  isImageField (fieldName: string): boolean {
    return this.imageFields.some((imageField) =>
      fieldName.toLowerCase().includes(imageField.toLowerCase()),
    );
  }

  canModifyField (fieldName: string): boolean {
    if (this.isSensitiveField(fieldName)) {
      return this.roleAccess.canModifySensitiveFields();
    }

    if (this.isRoleField(fieldName)) {
      return this.roleAccess.canEditRoles();
    }

    return true;
  }

  getFieldRule (fieldName: string): FieldRule {
    return {
      excluded: this.excludedFromUpdate.includes(fieldName),
      sensitive: this.isSensitiveField(fieldName),
      editable: this.canModifyField(fieldName),
      roleField: this.isRoleField(fieldName),
      imageField: this.isImageField(fieldName),
    };
  }

  getExcludedFields (): string[] {
    return [...this.excludedFromUpdate];
  }

  getSensitiveFields (): string[] {
    return [...this.sensitiveFields];
  }

  getRoleFields (): string[] {
    return [...this.roleFields];
  }

  getImageFields (): string[] {
    return [...this.imageFields];
  }

  addExcludedField (fieldName: string): void {
    if (!this.excludedFromUpdate.includes(fieldName)) {
      this.excludedFromUpdate.push(fieldName);
    }
  }

  addSensitiveField (fieldName: string): void {
    if (!this.sensitiveFields.includes(fieldName)) {
      this.sensitiveFields.push(fieldName);
    }
  }

  removeExcludedField (fieldName: string): void {
    const index = this.excludedFromUpdate.indexOf(fieldName);
    if (index > -1) {
      this.excludedFromUpdate.splice(index, 1);
    }
  }

  removeSensitiveField (fieldName: string): void {
    const index = this.sensitiveFields.indexOf(fieldName);
    if (index > -1) {
      this.sensitiveFields.splice(index, 1);
    }
  }
}
