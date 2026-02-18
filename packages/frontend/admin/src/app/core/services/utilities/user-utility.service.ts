import { Injectable, inject } from '@angular/core';

import { AuthService } from '../auth/auth.service';
import { UserRoleHelper } from './user-role-utility.service';

@Injectable({
  providedIn: 'root'
})
export class UserUtilityService {
  private authService = inject(AuthService);

  getUserInitials (user: { firstName?: string; lastName?: string; email?: string }): string {
    const firstName = user.firstName?.trim() || '';
    const lastName = user.lastName?.trim() || '';

    if (firstName && lastName) return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (lastName) return lastName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();

    return 'U';
  }

  canDeleteRecord (): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    return UserRoleHelper.isGlobalAdmin(currentUser.role);
  }

  canModifySensitiveFields (): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    return UserRoleHelper.isGlobalAdmin(currentUser.role);
  }

  canEditRoles (): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    return UserRoleHelper.isGlobalAdmin(currentUser.role);
  }

  isCurrentUser (userId: number): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? String(currentUser.id) === String(userId) : false;
  }
}
