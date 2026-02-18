import { UserRole } from '../../enums/user-roles.enum';

export class UserRoleHelper {
  static isGlobalAdmin (role: string): boolean {
    return role === (UserRole.GLOBAL_ADMIN as string);
  }

  static canEditRoles (role: string): boolean {
    return this.isGlobalAdmin(role);
  }

  static getAllRoles (): UserRole[] {
    return Object.values(UserRole);
  }

  static getRoleDisplayName (role: string): string {
    switch (role as UserRole) {
      case UserRole.GLOBAL_ADMIN:
        return 'Global Administrator';
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.MODERATOR:
        return 'Moderator';
      case UserRole.USER:
        return 'User';
      default:
        return 'Unknown Role';
    }
  }
}
