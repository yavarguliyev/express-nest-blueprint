import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalStorageUsage: number;
  apiRequestsToday: number;
}

export interface HealthStatus {
  overallStatus: string;
  timestamp: string;
  components: Array<{
    name: string;
    status: 'up' | 'down';
    details?: any;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);
  private baseUrl = '/api/v1/admin';

  getMetrics (): Observable<DashboardMetrics> {
    return this.http
      .get<{ success: boolean; data: DashboardMetrics }>(`${this.baseUrl}/dashboard/metrics`)
      .pipe(map((res) => res.data));
  }

  getHealth (): Observable<HealthStatus> {
    return this.http
      .get<{ success: boolean; data: HealthStatus }>(`${this.baseUrl}/health`)
      .pipe(map((res) => res.data));
  }
}
