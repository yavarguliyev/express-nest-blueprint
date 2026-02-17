import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  
  const token = localStorage.getItem('auth_token');
  const isAuthenticated = !!token;

  if (!isAuthenticated) {
    void router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
};
