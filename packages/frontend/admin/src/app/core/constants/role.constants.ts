import { UserRole } from '../enums/user-roles.enum';

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.GLOBAL_ADMIN]: 'Global Administrator',
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.MODERATOR]: 'Moderator',
  [UserRole.USER]: 'User'
} as const;

export const ROLE_OPTIONS = [
  { value: UserRole.GLOBAL_ADMIN, label: ROLE_DISPLAY_NAMES[UserRole.GLOBAL_ADMIN] },
  { value: UserRole.ADMIN, label: ROLE_DISPLAY_NAMES[UserRole.ADMIN] },
  { value: UserRole.MODERATOR, label: ROLE_DISPLAY_NAMES[UserRole.MODERATOR] },
  { value: UserRole.USER, label: ROLE_DISPLAY_NAMES[UserRole.USER] }
] as const;

export const ROLE_PERMISSIONS = {
  [UserRole.GLOBAL_ADMIN]: {
    canEditRoles: true,
    canModifySensitiveFields: true,
    canDeleteRecords: true,
    canAccessAllTables: true
  },
  [UserRole.ADMIN]: {
    canEditRoles: false,
    canModifySensitiveFields: false,
    canDeleteRecords: false,
    canAccessAllTables: true
  },
  [UserRole.MODERATOR]: {
    canEditRoles: false,
    canModifySensitiveFields: false,
    canDeleteRecords: false,
    canAccessAllTables: false
  },
  [UserRole.USER]: {
    canEditRoles: false,
    canModifySensitiveFields: false,
    canDeleteRecords: false,
    canAccessAllTables: false
  }
} as const;
