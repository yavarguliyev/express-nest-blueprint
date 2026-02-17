import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { HTTP_HEADERS, HTTP_STATUS } from '../../domain/constants/api.const';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('auth_token');

  let authReq = req;
  if (token && !req.headers.has(HTTP_HEADERS.AUTHORIZATION)) {
    authReq = req.clone({
      setHeaders: {
        [HTTP_HEADERS.AUTHORIZATION]: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === HTTP_STATUS.UNAUTHORIZED) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        void router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
