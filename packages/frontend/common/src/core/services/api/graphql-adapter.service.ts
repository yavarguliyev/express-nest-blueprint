import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiAdapter, ApiRequest, ApiResponse, GqlResponse, GqlError } from '../../../domain/interfaces/api.interface';

@Injectable({
  providedIn: 'root'
})
export class GraphQLAdapterService implements ApiAdapter {
  private readonly http = inject(HttpClient);

  execute<T> (request: ApiRequest): Observable<ApiResponse<T>> {
    const query = this.buildGraphQLQuery(request);
    const variables = request.body || {};

    const graphqlRequest = {
      query,
      variables
    };

    return this.http.post<GqlResponse<T>>(request.endpoint, graphqlRequest).pipe(
      map(response => this.transformResponse<T>(response)),
      catchError(error => throwError(() => this.transformError(error)))
    );
  }

  private buildGraphQLQuery (request: ApiRequest): string {
    const operation = this.getOperationType(request.method);
    const operationName = this.extractOperationName(request.endpoint);

    if (request.options?.skipAuth) {
      return `${operation} { ${operationName} }`;
    }

    return `${operation} ${operationName}($input: ${operationName}Input!) {
      ${operationName}(input: $input) {
        success
        data
        message
        errors {
          field
          message
          code
        }
      }
    }`;
  }

  private getOperationType (method: string): string {
    switch (method) {
      case 'GET':
        return 'query';
      case 'POST':
      case 'PUT':
      case 'PATCH':
      case 'DELETE':
        return 'mutation';
      default:
        return 'query';
    }
  }

  private extractOperationName (endpoint: string): string {
    const parts = endpoint.replace(/^\//, '').split('/');
    return parts
      .map((part, index) => {
        if (index === 0) return part;
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join('');
  }

  private transformResponse<T> (response: GqlResponse<T>): ApiResponse<T> {
    if (response.errors && response.errors.length > 0) {
      return {
        success: false,
        data: null as T,
        message: response.errors[0].message,
        errors: response.errors.map(err => ({
          message: err.message,
          field: err.path?.join('.'),
          code: 'GRAPHQL_ERROR'
        }))
      };
    }

    if (this.isApiResponse(response.data)) {
      return response.data as ApiResponse<T>;
    }

    return {
      success: true,
      data: response.data,
      message: 'Success'
    };
  }

  private transformError (error: unknown): ApiResponse<never> {
    if (this.isHttpError(error)) {
      const gqlErrors = error.error?.errors;

      if (gqlErrors && gqlErrors.length > 0) {
        return {
          success: false,
          data: null as never,
          message: gqlErrors[0].message,
          errors: gqlErrors.map(err => ({
            message: err.message,
            field: err.path?.join('.'),
            code: 'GRAPHQL_ERROR'
          }))
        };
      }

      return {
        success: false,
        data: null as never,
        message: error.error?.message || 'GraphQL request failed',
        errors: [{ message: error.error?.message || 'GraphQL request failed' }]
      };
    }

    return {
      success: false,
      data: null as never,
      message: 'An unexpected error occurred',
      errors: [{ message: String(error) }]
    };
  }

  private isApiResponse (obj: unknown): obj is ApiResponse<unknown> {
    return typeof obj === 'object' && obj !== null && 'success' in obj && 'data' in obj && 'message' in obj;
  }

  private isHttpError (error: unknown): error is { error?: { message?: string; errors?: GqlError[] } } {
    return typeof error === 'object' && error !== null && 'error' in error;
  }
}
