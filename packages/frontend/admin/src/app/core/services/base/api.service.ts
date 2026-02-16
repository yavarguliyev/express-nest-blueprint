import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface ApiRequestOptions {
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | undefined;
}

export interface GqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);

  get<T> (endpoint: string, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    const params = this.buildHttpParams(options?.params);
    const config: { params: HttpParams; headers?: Record<string, string> } = { params };
    if (options?.headers) {
      config.headers = options.headers;
    }

    return this.http
      .get<ApiResponse<T>>(endpoint, config)
      .pipe(catchError((error) => this.handleError(error)));
  }

  post<T> (endpoint: string, body: unknown, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    const params = this.buildHttpParams(options?.params);
    const config: { params: HttpParams; headers?: Record<string, string> } = { params };
    if (options?.headers) {
      config.headers = options.headers;
    }

    return this.http
      .post<ApiResponse<T>>(endpoint, body, config)
      .pipe(catchError((error) => this.handleError(error)));
  }

  put<T> (endpoint: string, body: unknown, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    const params = this.buildHttpParams(options?.params);
    const config: { params: HttpParams; headers?: Record<string, string> } = { params };
    if (options?.headers) {
      config.headers = options.headers;
    }

    return this.http
      .put<ApiResponse<T>>(endpoint, body, config)
      .pipe(catchError((error) => this.handleError(error)));
  }

  patch<T> (endpoint: string, body: unknown, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    const params = this.buildHttpParams(options?.params);
    const config: { params: HttpParams; headers?: Record<string, string> } = { params };
    if (options?.headers) {
      config.headers = options.headers;
    }

    return this.http
      .patch<ApiResponse<T>>(endpoint, body, config)
      .pipe(catchError((error) => this.handleError(error)));
  }

  delete<T> (endpoint: string, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    const params = this.buildHttpParams(options?.params);
    const config: { params: HttpParams; headers?: Record<string, string> } = { params };
    if (options?.headers) {
      config.headers = options.headers;
    }

    return this.http
      .delete<ApiResponse<T>>(endpoint, config)
      .pipe(catchError((error) => this.handleError(error)));
  }

  graphql<T> (
    endpoint: string,
    query: string,
    variables?: Record<string, unknown>,
  ): Observable<ApiResponse<T>> {
    return new Observable((observer) => {
      this.http
        .post<GqlResponse<T>>(endpoint, { query, variables })
        .pipe(catchError((error) => this.handleError(error)))
        .subscribe({
          next: (gqlResponse) => {
            const apiResponse: ApiResponse<T> = {
              success: !gqlResponse.errors || gqlResponse.errors.length === 0,
              data: gqlResponse.data as T,
              message: gqlResponse.errors?.[0]?.message ?? '',
            };
            observer.next(apiResponse);
            observer.complete();
          },
          error: (error) => {
            observer.error(error);
          },
        });
    });
  }

  private buildHttpParams (params?: Record<string, string | number | boolean>): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return httpParams;
  }

  private handleError (error: unknown): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error && typeof error === 'object') {
      const err = error as {
        error?: { message?: string };
        message?: string;
        status?: number;
        statusText?: string;
      };

      if (err.error?.message) {
        errorMessage = err.error.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.statusText) {
        errorMessage = `${err.status}: ${err.statusText}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
