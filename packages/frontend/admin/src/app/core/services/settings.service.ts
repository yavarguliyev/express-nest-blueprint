import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  loadSettings (): Observable<ApiResponse<SettingItem[]>> {
    return this.http.get<ApiResponse<SettingItem[]>>(API_ENDPOINTS.SETTINGS.GET_ALL);
  }

  updateSettings (updateRequest: SettingsUpdateRequest): Observable<ApiResponse<SettingItem[]>> {
    return this.http.put<ApiResponse<SettingItem[]>>(API_ENDPOINTS.SETTINGS.UPDATE, updateRequest);
  }

  refreshSettings (): Observable<ApiResponse<SettingItem[]>> {
    return this.loadSettings();
  }
}
