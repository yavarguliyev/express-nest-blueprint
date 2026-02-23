import { HealthRegistryItem, DashboardChartConfig, PromMetric } from '@config/libs';
import { DashboardMetricsContext, DashboardMetric, DashboardAlert } from './admin.interface';

export interface DashboardMetricResolver {
  context: DashboardMetricsContext;
  resolveMetricValue: (reg: HealthRegistryItem, ctx: DashboardMetricsContext) => number;
  resolveChartData: (config: DashboardChartConfig, rawMetrics: PromMetric[]) => { label: string; value: number }[];
  generateAlerts: (metrics: DashboardMetric[]) => DashboardAlert[];
}
