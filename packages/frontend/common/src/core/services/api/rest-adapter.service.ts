import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiAdapter, ApiRequest, ApiResponse, ApiError } from '../../../domain/interfaces/api.interface';
import { HTTP_STATUS } from '../../../domain/constants/api.const';

@Injectable({
  providedIn: 'root'
})
export class RestAdapterService implements ApiAdapter {
  private readonly http = inject(HttpClient);

  execute<T> (request: ApiRequest): Observable<ApiResponse<T>> {
    const url = request.endpoint;
    const options = this.buildHttpOptions(request);

    let httpCall: Observable<unknown>;

    const method = request.method as string;
    switch (method) {
      case 'GET':
        httpCall = this.http.get(url, options);
        break;
      case 'POST':
        httpCall = this.http.post(url, request.body, options);
        break;
      case 'PUT':
        httpCall = this.http.put(url, request.body, options);
        break;
      case 'PATCH':
        httpCall = this.http.patch(url, request.body, options);
        break;
      case 'DELETE':
        httpCall = this.http.delete(url, options);
        break;
      default:
        return throwError(() => new Error(`Unsupported HTTP method: ${request.method}`));
    }

    return httpCall.pipe(
      map(response => this.transformResponse<T>(response)),
      catchError(error => throwError(() => this.transformError(error)))
    );
  }

  private buildHttpOptions (request: ApiRequest): {
    headers?: HttpHeaders;
    params?: HttpParams;
  } {
    const options: { headers?: HttpHeaders; params?: HttpParams } = {};

    if (request.headers) {
      options.headers = new HttpHeaders(request.headers);
    }

    if (request.params) {
      let params = new HttpParams();
      Object.entries(request.params).forEach(([key, value]) => {
        params = params.set(key, String(value));
      });
      options.params = params;
    }

    return options;
  }

  private transformResponse<T> (response: unknown): ApiResponse<T> {
    if (this.isApiResponse(response)) {
      return response as ApiResponse<T>;
    }

    return {
      success: true,
      data: response as T,
      message: 'Success'
    };
  }

  private transformError (error: unknown): ApiResponse<never> {
    const apiErrors: ApiError[] = [];

    if (this.isHttpError(error)) {
      const status = error.status;
      const message = error.error?.message || error.message || 'An error occurred';

      if (error.error?.errors && Array.isArray(error.error.errors)) {
        apiErrors.push(...error.error.errors);
      } else {
        apiErrors.push({ message });
      }

      return {
        success: false,
        data: null as never,
        message: this.getErrorMessage(status),
        errors: apiErrors
      };
    }

    return {
      success: false,
      data: null as never,
      message: 'An unexpected error occurred',
      errors: [{ message: String(error) }]
    };
  }

  private getErrorMessage (status: number): string {
    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        return 'Invalid request';
      case HTTP_STATUS.UNAUTHORIZED:
        return 'Authentication required';
      case HTTP_STATUS.FORBIDDEN:
        return 'Access denied';
      case HTTP_STATUS.NOT_FOUND:
        return 'Resource not found';
      case HTTP_STATUS.CONFLICT:
        return 'Resource conflict';
      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        return 'Validation failed';
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return 'Server error';
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        return 'Service unavailable';
      default:
        return 'Request failed';
    }
  }

  private isApiResponse (obj: unknown): obj is ApiResponse<unknown> {
    return typeof obj === 'object' && obj !== null && 'success' in obj && 'data' in obj && 'message' in obj;
  }

  private isHttpError (error: unknown): error is { status: number; error?: { message?: string; errors?: ApiError[] }; message?: string } {
    return typeof error === 'object' && error !== null && 'status' in error;
  }
}
