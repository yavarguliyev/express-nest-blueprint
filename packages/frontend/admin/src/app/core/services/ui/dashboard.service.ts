import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_ENDPOINTS } from '../../constants/api.constants';
import { DashboardResponse, HealthStatus, ServiceHealth, HealthLogEntry } from '../../interfaces/dashboard.interface';
import { ServiceHealthStatus } from '../../types/dashboard.type';
import { MetricStatus } from '../../types/dashboard.type';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);

  getMetrics (): Observable<DashboardResponse> {
    return this.http
      .get<{ success: boolean; data: DashboardResponse }>(API_ENDPOINTS.ADMIN.DASHBOARD_METRICS)
      .pipe(map((res: { success: boolean; data: DashboardResponse }) => res.data));
  }

  getHealth (): Observable<HealthStatus> {
    return this.http
      .get<{ success: boolean; data: HealthStatus }>(API_ENDPOINTS.ADMIN.HEALTH)
      .pipe(map((res: { success: boolean; data: HealthStatus }) => this.normalizeHealthStatus(res.data)));
  }

  getHealthLogs (): Observable<HealthLogEntry[]> {
    return this.http
      .get<{ success: boolean; data: HealthLogEntry[] }>(API_ENDPOINTS.ADMIN.HEALTH_LOGS)
      .pipe(map((res: { success: boolean; data: HealthLogEntry[] }) => res.data));
  }

  refreshMetrics (): Observable<DashboardResponse> {
    return this.getMetrics();
  }

  refreshHealth (): Observable<HealthStatus> {
    return this.getHealth();
  }

  private normalizeHealthStatus (data: HealthStatus): HealthStatus {
    const normalizeList = (list: ServiceHealth[] | undefined): ServiceHealth[] => {
      if (!Array.isArray(list)) return [];
      return list.map(this.normalizeServiceHealth);
    };

    return {
      ...data,
      services: normalizeList(data.services),
      components: normalizeList(data.components)
    };
  }

  private normalizeServiceHealth = (service: ServiceHealth): ServiceHealth => ({
    ...service,
    status: this.mapStatus(service.status)
  });

  private mapStatus (status: ServiceHealthStatus): MetricStatus {
    if (status === 'up') return 'healthy';
    if (status === 'degraded') return 'degraded';
    return 'down';
  }
}
