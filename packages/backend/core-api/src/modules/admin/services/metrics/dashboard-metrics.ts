import { Injectable, nowISO, HEALTH_REGISTRY, DASHBOARD_CHARTS, HealthRegistryItem, DashboardChartConfig } from '@config/libs';

import { DashboardMetricResolver } from '@modules/admin/interfaces/admin-dashboard-metrics.interface';
import { ChartData, DashboardMetric, DashboardMetricsResponse } from '@modules/admin/interfaces/admin.interface';

@Injectable()
export class DashboardMetricsBuilder {
  buildDashboardMetrics (params: DashboardMetricResolver): DashboardMetricsResponse {
    const { context, resolveMetricValue, resolveChartData, generateAlerts } = params;
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
