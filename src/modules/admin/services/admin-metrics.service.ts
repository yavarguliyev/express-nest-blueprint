import { register } from 'prom-client';

import { Injectable } from '@common/decorators';
import { ChartData, DashboardMetric } from '@modules/admin/interfaces';

@Injectable()
export class AdminMetricsService {
  async getDashboardMetrics (): Promise<{ metrics: DashboardMetric[]; charts: ChartData[] }> {
    const rawMetrics = await register.getMetricsAsJSON();

    const metrics: DashboardMetric[] = [];
    const charts: ChartData[] = [];

    for (const metric of rawMetrics) {
      if (metric.name === 'http_requests_total' && String(metric.type) === 'counter') {
        const totalRequests = metric.values.reduce((sum, val) => sum + val.value, 0);
        metrics.push({
          name: 'Total HTTP Requests',
          value: totalRequests,
          timestamp: new Date().toISOString()
        });

        const requestsByStatus = metric.values.reduce(
          (acc, val) => {
            const status = (val.labels && (val.labels['status'] as string)) || 'unknown';
            acc[status] = (acc[status] || 0) + val.value;
            return acc;
          },
          {} as Record<string, number>
        );

        charts.push({
          title: 'Requests by Status Code',
          type: 'pie',
          data: Object.entries(requestsByStatus).map(([label, value]) => ({ label, value }))
        });
      }

      if (metric.name === 'http_request_duration_seconds' && String(metric.type) === 'histogram') {
        const buckets = metric.values.filter((v) => {
          const metricValue = v as { metricName?: string };
          return metricValue.metricName?.includes('_bucket');
        });
        if (buckets.length > 0) {
          charts.push({
            title: 'Request Duration Distribution',
            type: 'bar',
            data: buckets.slice(0, 5).map((b) => ({
              label: `${(b.labels && b.labels['le']) || 'inf'}s`,
              value: b.value
            }))
          });
        }
      }

      if (metric.name === 'process_cpu_user_seconds_total') {
        metrics.push({
          name: 'CPU Usage',
          value: (metric.values[0]?.value as number) || 0,
          unit: 'seconds',
          timestamp: new Date().toISOString()
        });
      }

      if (metric.name === 'nodejs_heap_size_used_bytes') {
        const heapUsed = ((metric.values[0]?.value as number) || 0) / 1024 / 1024;
        metrics.push({
          name: 'Memory Usage',
          value: Math.round(heapUsed * 100) / 100,
          unit: 'MB',
          timestamp: new Date().toISOString()
        });
      }
    }

    return { metrics, charts };
  }
}
