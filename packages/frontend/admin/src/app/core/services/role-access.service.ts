import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { UserRoleHelper, UserRoles } from '../enums/user-roles.enum';

@Injectable({
  providedIn: 'root',
})
export class RoleAccessService {
  private authService = inject(AuthService);

  isGlobalAdmin (): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? UserRoleHelper.isGlobalAdmin(currentUser.role) : false;
  }

  canEditRoles (): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? UserRoleHelper.canEditRoles(currentUser.role) : false;
  }

  canDeleteRecords (): boolean {
    return this.isGlobalAdmin();
  }

  canModifySensitiveFields (): boolean {
    return this.isGlobalAdmin();
  }

  getRoleDisplayName (role: string): string {
    return UserRoleHelper.getRoleDisplayName(role);
  }

  getCurrentUserRole (): string | null {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? currentUser.role : null;
  }

  getCurrentUserRoleDisplayName (): string {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return 'Unknown Role';
    }
    return UserRoleHelper.getRoleDisplayName(currentUser.role);
  }

  getAllRoles (): UserRoles[] {
    return UserRoleHelper.getAllRoles();
  }

  getAvailableRoles (): { value: string; label: string }[] {
    return [
      { value: UserRoles.GLOBAL_ADMIN, label: 'Global Administrator' },
      { value: UserRoles.ADMIN, label: 'Administrator' },
      { value: UserRoles.MODERATOR, label: 'Moderator' },
      { value: UserRoles.USER, label: 'User' },
    ];
  }

  hasRole (role: UserRoles): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? currentUser.role === (role as string) : false;
  }

  hasAnyRole (roles: UserRoles[]): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    return roles.some((role) => currentUser.role === (role as string));
  }

  isCurrentUser (userId: number): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? currentUser.id === userId : false;
  }
}
