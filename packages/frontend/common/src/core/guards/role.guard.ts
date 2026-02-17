import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const router = inject(Router);
    
    const userDataStr = localStorage.getItem('user_data');
    
    if (!userDataStr) {
      void router.navigate(['/login']);
      return false;
    }

    try {
      const userData = JSON.parse(userDataStr) as { role: string };
      const userRole = userData.role;

      if (!allowedRoles.includes(userRole)) {
        void router.navigate(['/access-denied']);
        return false;
      }

      return true;
    } catch {
      void router.navigate(['/login']);
      return false;
    }
  };
};
