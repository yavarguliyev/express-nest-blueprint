import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { HTTP_STATUS } from '../../domain/constants/api.const';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';

      if (error.status) {
        switch (error.status) {
          case HTTP_STATUS.BAD_REQUEST:
            errorMessage = 'Invalid request. Please check your input.';
            break;
          case HTTP_STATUS.UNAUTHORIZED:
            errorMessage = 'Authentication required. Please log in.';
            break;
          case HTTP_STATUS.FORBIDDEN:
            errorMessage = 'Access denied. You do not have permission.';
            break;
          case HTTP_STATUS.NOT_FOUND:
            errorMessage = 'Resource not found.';
            break;
          case HTTP_STATUS.CONFLICT:
            errorMessage = 'Resource conflict. The item may already exist.';
            break;
          case HTTP_STATUS.UNPROCESSABLE_ENTITY:
            errorMessage = 'Validation failed. Please check your input.';
            break;
          case HTTP_STATUS.INTERNAL_SERVER_ERROR:
            errorMessage = 'Server error. Please try again later.';
            break;
          case HTTP_STATUS.SERVICE_UNAVAILABLE:
            errorMessage = 'Service unavailable. Please try again later.';
            break;
          default:
            errorMessage = `Request failed with status ${error.status}`;
        }
      } else if (error.error instanceof ErrorEvent) {
        errorMessage = `Error: ${error.error.message}`;
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network.';
      }

      const enhancedError = error as HttpErrorResponse & { userMessage?: string };
      enhancedError.userMessage = errorMessage;

      return throwError(() => enhancedError);
    })
  );
};
