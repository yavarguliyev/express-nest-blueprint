import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface DashboardMetric {
  name: string;
  value: number;
  unit?: string;
  timestamp: string;
}

export interface ChartData {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'gauge';
  data: Array<{ label: string; value: number }>;
}

export interface DashboardAlert {
  header?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: string;
}

export interface DashboardResponse {
  metrics: DashboardMetric[];
  charts: ChartData[];
  alerts: DashboardAlert[];
}

export interface HealthStatus {
  overallStatus: string;
  timestamp: string;
  components: Array<{
    name: string;
    status: 'up' | 'down';
    details?: Record<string, unknown>;
  }>;
}

@Injectable({
  providedIn: 'root',
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
      .pipe(map((res: { success: boolean; data: HealthStatus }) => res.data));
  }

  refreshMetrics (): Observable<DashboardResponse> {
    return this.getMetrics();
  }

  refreshHealth (): Observable<HealthStatus> {
    return this.getHealth();
  }
}
