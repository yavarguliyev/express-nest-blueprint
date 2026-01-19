/**
 * User Roles Enum
 * 
 * Defines the hierarchy and permissions for different user types in the system.
 */
export enum UserRoles {
  GLOBAL_ADMIN = 'global admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user'
}

/**
 * Helper functions for role management
 */
export class UserRoleHelper {
  
  /**
   * Check if a user has global admin privileges
   */
  static isGlobalAdmin (role: string): boolean {
    return role === UserRoles.GLOBAL_ADMIN as string;
  }

  /**
   * Check if a user can edit roles (only global admins)
   */
  static canEditRoles (role: string): boolean {
    return this.isGlobalAdmin(role);
  }

  /**
   * Get all available roles
   */
  static getAllRoles (): UserRoles[] {
    return Object.values(UserRoles);
  }

  /**
   * Get role display name
   */
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