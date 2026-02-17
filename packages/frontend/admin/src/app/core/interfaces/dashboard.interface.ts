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

export interface MetricConfig {
  icon: string;
  iconClass: string;
  iconStyle?: string;
  format: string;
}
