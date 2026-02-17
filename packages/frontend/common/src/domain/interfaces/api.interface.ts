import { Observable } from 'rxjs';

import { HttpMethod, ApiProtocol } from '../enums/api.enum';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: ApiError[];
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GqlResponse<T> {
  data: T;
  errors?: GqlError[];
}

export interface GqlError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
}

export interface ApiRequest {
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  options?: ApiRequestOptions;
}

export interface ApiRequestOptions {
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  skipLoading?: boolean;
  skipNotification?: boolean;
}

export interface ApiClientConfig {
  baseUrl: string;
  protocol: ApiProtocol;
  timeout?: number;
  retryConfig?: RetryConfig;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatuses?: number[];
}

export interface ApiAdapter {
  execute<T>(request: ApiRequest): Observable<ApiResponse<T>>;
}
