import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, of } from 'rxjs';
import { GlobalCacheService } from './global-cache.service';
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
  private cacheService = inject(GlobalCacheService);
  private readonly METRICS_CACHE_TTL = 2 * 60 * 1000;
  private readonly HEALTH_CACHE_TTL = 1 * 60 * 1000;

  getMetrics (useCache: boolean = true): Observable<DashboardResponse> {
    if (useCache) {
      const cachedMetrics = this.cacheService.get<DashboardResponse>('dashboard-metrics');
      if (cachedMetrics) {
        return of(cachedMetrics);
      }

      const localCached = localStorage.getItem('dashboard-metrics-cache');
      const localCacheTime = localStorage.getItem('dashboard-metrics-cache-time');
      if (localCached && localCacheTime) {
        const age = Date.now() - parseInt(localCacheTime);
        if (age < 5 * 60 * 1000) {
          const data = JSON.parse(localCached) as DashboardResponse;
          this.cacheService.set('dashboard-metrics', data, this.METRICS_CACHE_TTL);
          return of(data);
        }
      }
    }

    return this.http
      .get<{ success: boolean; data: DashboardResponse }>(API_ENDPOINTS.ADMIN.DASHBOARD_METRICS)
      .pipe(
        map((res: { success: boolean; data: DashboardResponse }) => res.data),
        tap((data: DashboardResponse) => {
          this.cacheService.set('dashboard-metrics', data, this.METRICS_CACHE_TTL);
          localStorage.setItem('dashboard-metrics-cache', JSON.stringify(data));
          localStorage.setItem('dashboard-metrics-cache-time', Date.now().toString());
        }),
      );
  }

  getHealth (useCache: boolean = true): Observable<HealthStatus> {
    if (useCache) {
      const cachedHealth = this.cacheService.get<HealthStatus>('dashboard-health');
      if (cachedHealth) {
        return of(cachedHealth);
      }

      const localCached = localStorage.getItem('dashboard-health-cache');
      const localCacheTime = localStorage.getItem('dashboard-health-cache-time');
      if (localCached && localCacheTime) {
        const age = Date.now() - parseInt(localCacheTime);
        if (age < 2 * 60 * 1000) {
          const data = JSON.parse(localCached) as HealthStatus;
          this.cacheService.set('dashboard-health', data, this.HEALTH_CACHE_TTL);
          return of(data);
        }
      }
    }

    return this.http.get<{ success: boolean; data: HealthStatus }>(API_ENDPOINTS.ADMIN.HEALTH).pipe(
      map((res: { success: boolean; data: HealthStatus }) => res.data),
      tap((data: HealthStatus) => {
        this.cacheService.set('dashboard-health', data, this.HEALTH_CACHE_TTL);
        localStorage.setItem('dashboard-health-cache', JSON.stringify(data));
        localStorage.setItem('dashboard-health-cache-time', Date.now().toString());
      }),
    );
  }

  refreshMetrics (): Observable<DashboardResponse> {
    return this.getMetrics(false);
  }

  refreshHealth (): Observable<HealthStatus> {
    return this.getHealth(false);
  }

  hasValidCache (): { metrics: boolean; health: boolean } {
    const memoryCache = {
      metrics: this.cacheService.has('dashboard-metrics'),
      health: this.cacheService.has('dashboard-health'),
    };

    const localMetricsTime = localStorage.getItem('dashboard-metrics-cache-time');
    const localHealthTime = localStorage.getItem('dashboard-health-cache-time');
    const now = Date.now();

    const localCache = {
      metrics: !!(localMetricsTime && now - parseInt(localMetricsTime) < 5 * 60 * 1000),
      health: !!(localHealthTime && now - parseInt(localHealthTime) < 2 * 60 * 1000),
    };

    return {
      metrics: memoryCache.metrics || localCache.metrics,
      health: memoryCache.health || localCache.health,
    };
  }
}
