import { UserRoles } from '../enums/user-roles.enum';

export class UserRoleHelper {
  static isGlobalAdmin (role: string): boolean {
    return role === (UserRoles.GLOBAL_ADMIN as string);
  }

  static canEditRoles (role: string): boolean {
    return this.isGlobalAdmin(role);
  }

  static getAllRoles (): UserRoles[] {
    return Object.values(UserRoles);
  }

  static getRoleDisplayName (role: string): string {
    switch (role as UserRoles) {
      case UserRoles.GLOBAL_ADMIN:
        return 'Global Administrator';
      case UserRoles.ADMIN:
        return 'Administrator';
      case UserRoles.MODERATOR:
        return 'Moderator';
      case UserRoles.USER:
        return 'User';
      default:
        return 'Unknown Role';
    }
  }
}
