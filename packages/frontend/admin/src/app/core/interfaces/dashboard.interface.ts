import { MetricTrend, MetricType, SeverityType, MetricStatus } from '../types/dashboard.type';

export interface DashboardMetric {
  name: string;
  value: number;
  unit?: string;
  trend?: MetricTrend;
}

export interface ChartData {
  title: string;
  type: MetricType;
  data: Array<{ label: string; value: number }>;
}

export interface DashboardAlert {
  severity: SeverityType;
  header?: string;
  title: string;
  message: string;
  type: SeverityType;
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
  services: ServiceHealth[];
  components: ServiceHealth[];
}

export interface ServiceHealth {
  name: string;
  status: MetricStatus;
  responseTime?: number;
  message?: string;
}

export interface MetricConfig {
  icon: string;
  iconClass: string;
  iconStyle?: string;
  format: string;
}
