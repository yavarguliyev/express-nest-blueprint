import { Injectable, nowISO, ALERT_TEMPLATES, METRIC_CONFIG, HEALTH_REGISTRY, HealthRegistryItem, AlertTemplate, PromMetric } from '@config/libs';

import { ChartConfig, ChartDataPoint, DashboardAlert, DashboardMetric } from '@modules/admin/interfaces/admin.interface';

@Injectable()
export class MetricCalculators {
  resolveChartData (config: ChartConfig, rawMetrics: PromMetric[]): ChartDataPoint[] {
    const metric = rawMetrics.find((m): boolean => m.name === config.metric);

    if (!metric) return [];
    if (config.metric === METRIC_CONFIG.NAMES.HTTP_DURATION) return this.calculateHttpDurationChart(metric);
    if (config.metric === METRIC_CONFIG.NAMES.HTTP_TOTAL) return this.calculateHttpTotalChart(metric);
    return [];
  }

  generateAlerts (metrics: DashboardMetric[]): DashboardAlert[] {
    const ts = nowISO();
    const t = ALERT_TEMPLATES.THRESHOLD_EXCEEDED as AlertTemplate;
    const s = ALERT_TEMPLATES.SYSTEM_STABLE as AlertTemplate;
    const alerts = this.findThresholdExceededAlerts(metrics, t, ts);

    return alerts.length ? alerts : [this.createSystemStableAlert(s, ts)];
  }

  private calculateHttpDurationChart (metric: PromMetric): ChartDataPoint[] {
    return metric.values.slice(0, 5).map(
      (v): ChartDataPoint => ({
        label: `${String(v.labels?.['le'] || 'inf')}s`,
        value: v.value
      })
    );
  }

  private calculateHttpTotalChart (metric: PromMetric): ChartDataPoint[] {
    const stats = metric.values
      .filter((v): boolean => (v.labels?.['path'] as string)?.startsWith('/api'))
      .reduce((acc: Record<string, number>, v): Record<string, number> => {
        const status = String(v.labels?.['status'] || 'unk');
        acc[status] = (acc[status] || 0) + v.value;
        return acc;
      }, {});

    return Object.entries(stats).map(([label, value]): ChartDataPoint => ({ label, value }));
  }

  private findThresholdExceededAlerts (metrics: DashboardMetric[], template: AlertTemplate, timestamp: string): DashboardAlert[] {
    return (Object.values(HEALTH_REGISTRY) as HealthRegistryItem[])
      .filter((r): boolean => this.isThresholdExceeded(r, metrics))
      .map((r): DashboardAlert => this.createThresholdAlert(r, metrics, template, timestamp));
  }

  private isThresholdExceeded (reg: HealthRegistryItem, metrics: DashboardMetric[]): boolean {
    if (!reg.threshold) return false;
    const metricValue = metrics.find((m): boolean => m.name === reg.name)?.value || 0;
    return metricValue > reg.threshold;
  }

  private createThresholdAlert (reg: HealthRegistryItem, metrics: DashboardMetric[], template: AlertTemplate, timestamp: string): DashboardAlert {
    const metric = metrics.find((m): boolean => m.name === reg.name)!;
    return {
      header: template.header,
      title: template.title(reg.name),
      type: 'warning' as const,
      timestamp,
      message: template.message(reg.name, metric.value, reg.unit || '', reg.precision)
    };
  }

  private createSystemStableAlert (template: AlertTemplate, timestamp: string): DashboardAlert {
    return {
      header: template.header,
      title: template.title(''),
      message: template.message('', 0, ''),
      type: 'info' as const,
      timestamp
    };
  }
}
