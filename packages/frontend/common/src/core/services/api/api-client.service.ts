import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientConfig, ApiRequest, ApiRequestOptions, ApiResponse } from '../../../domain/interfaces/api.interface';
import { ApiProtocol, HttpMethod } from '../../../domain/enums/api.enum';
import { DEFAULT_API_TIMEOUT } from '../../../domain/constants/api.const';
import { RestAdapterService } from './rest-adapter.service';
import { GraphQLAdapterService } from './graphql-adapter.service';

@Injectable({
  providedIn: 'root'
})
export class ApiClientService {
  private readonly restAdapter = inject(RestAdapterService);
  private readonly graphqlAdapter = inject(GraphQLAdapterService);

  private _config = signal<ApiClientConfig>({
    baseUrl: '',
    protocol: ApiProtocol.REST,
    timeout: DEFAULT_API_TIMEOUT
  });

  configure (config: ApiClientConfig): void {
    this._config.set(config);
  }

  setProtocol (protocol: ApiProtocol): void {
    this._config.update(config => ({ ...config, protocol }));
  }

  get<T> (endpoint: string, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.execute<T>({
      method: HttpMethod.GET,
      endpoint: this.buildUrl(endpoint),
      params: options?.params,
      headers: options?.headers,
      options
    });
  }

  post<T> (endpoint: string, body: unknown, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.execute<T>({
      method: HttpMethod.POST,
      endpoint: this.buildUrl(endpoint),
      body,
      params: options?.params,
      headers: options?.headers,
      options
    });
  }

  put<T> (endpoint: string, body: unknown, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.execute<T>({
      method: HttpMethod.PUT,
      endpoint: this.buildUrl(endpoint),
      body,
      params: options?.params,
      headers: options?.headers,
      options
    });
  }

  patch<T> (endpoint: string, body: unknown, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.execute<T>({
      method: HttpMethod.PATCH,
      endpoint: this.buildUrl(endpoint),
      body,
      params: options?.params,
      headers: options?.headers,
      options
    });
  }

  delete<T> (endpoint: string, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.execute<T>({
      method: HttpMethod.DELETE,
      endpoint: this.buildUrl(endpoint),
      params: options?.params,
      headers: options?.headers,
      options
    });
  }

  getConfig (): ApiClientConfig {
    return this._config();
  }

  private execute<T> (request: ApiRequest): Observable<ApiResponse<T>> {
    const config = this._config();
    const adapter = config.protocol === ApiProtocol.REST ? this.restAdapter : this.graphqlAdapter;

    return adapter.execute<T>(request);
  }

  private buildUrl (endpoint: string): string {
    const config = this._config();
    const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    return `${baseUrl}${path}`;
  }
}
