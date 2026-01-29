import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { GlobalCacheService } from './global-cache.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface SettingItem {
  id: string;
  label: string;
  description: string;
  value: boolean;
  isActive: boolean;
  category: string;
}

export interface SettingsUpdateRequest {
  settings: Array<{
    key: string;
    value: boolean;
    isActive?: boolean;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private http = inject(HttpClient);
  private cacheService = inject(GlobalCacheService);

  private readonly SETTINGS_CACHE_TTL = 5 * 60 * 1000;

  loadSettings (useCache: boolean = false): Observable<ApiResponse<SettingItem[]>> {
    const cacheKey = 'system-settings';

    if (useCache) {
      const cachedSettings = this.cacheService.get<ApiResponse<SettingItem[]>>(cacheKey);
      if (cachedSettings) {
        return of(cachedSettings);
      }
    }

    return this.http.get<ApiResponse<SettingItem[]>>(API_ENDPOINTS.SETTINGS.GET_ALL).pipe(
      tap((response) => {
        this.cacheService.set(cacheKey, response, this.SETTINGS_CACHE_TTL);
      }),
    );
  }

  updateSettings (updateRequest: SettingsUpdateRequest): Observable<ApiResponse<SettingItem[]>> {
    return this.http
      .put<ApiResponse<SettingItem[]>>(API_ENDPOINTS.SETTINGS.UPDATE, updateRequest)
      .pipe(
        tap((response) => {
          const cacheKey = 'system-settings';
          this.cacheService.set(cacheKey, response, this.SETTINGS_CACHE_TTL);
        }),
      );
  }

  refreshSettings (): Observable<ApiResponse<SettingItem[]>> {
    return this.loadSettings(false);
  }

  invalidateCache (): void {
    this.cacheService.delete('system-settings');
  }

  hasValidCache (): boolean {
    return this.cacheService.has('system-settings');
  }
}
