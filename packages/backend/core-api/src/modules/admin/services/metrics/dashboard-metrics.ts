import { Injectable, nowISO, HEALTH_REGISTRY, DASHBOARD_CHARTS, HealthRegistryItem, DashboardChartConfig, PromMetric } from '@config/libs';

import {
  ChartData,
  DashboardMetric,
  DashboardAlert,
  DashboardMetricsResponse,
  DashboardMetricsContext
} from '@modules/admin/interfaces/admin.interface';

@Injectable()
export class DashboardMetricsBuilder {
  public buildDashboardMetrics (
    context: DashboardMetricsContext,
    resolveMetricValue: (reg: HealthRegistryItem, ctx: DashboardMetricsContext) => number,
    resolveChartData: (config: DashboardChartConfig, rawMetrics: PromMetric[]) => { label: string; value: number }[],
    generateAlerts: (metrics: DashboardMetric[]) => DashboardAlert[]
  ): DashboardMetricsResponse {
    const timestamp = nowISO();

    const metrics: DashboardMetric[] = (Object.values(HEALTH_REGISTRY) as HealthRegistryItem[]).map(
      (reg): DashboardMetric => ({
        name: reg.name,
        value: resolveMetricValue(reg, context),
        unit: reg.unit ?? '',
        timestamp
      })
    );

    const charts: ChartData[] = (Object.values(DASHBOARD_CHARTS) as DashboardChartConfig[]).map(
      (config): ChartData => ({
        title: config.title,
        type: config.type,
        data: resolveChartData(config, context.rawMetrics)
      })
    );

    return { metrics, charts, alerts: generateAlerts(metrics) };
  }
}
