import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_ENDPOINTS } from '../../constants/api.constants';
import { DashboardResponse, HealthStatus } from '../../interfaces/dashboard.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);

  getMetrics(): Observable<DashboardResponse> {
    return this.http
      .get<{ success: boolean; data: DashboardResponse }>(API_ENDPOINTS.ADMIN.DASHBOARD_METRICS)
      .pipe(map((res: { success: boolean; data: DashboardResponse }) => res.data));
  }

  getHealth(): Observable<HealthStatus> {
    return this.http
      .get<{ success: boolean; data: HealthStatus }>(API_ENDPOINTS.ADMIN.HEALTH)
      .pipe(map((res: { success: boolean; data: HealthStatus }) => res.data));
  }

  refreshMetrics(): Observable<DashboardResponse> {
    return this.getMetrics();
  }

  refreshHealth(): Observable<HealthStatus> {
    return this.getHealth();
  }
}
