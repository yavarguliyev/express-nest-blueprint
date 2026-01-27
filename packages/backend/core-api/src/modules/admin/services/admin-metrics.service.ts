import { register, MetricValue } from 'prom-client';

import { Injectable } from '@config/libs';

import { ChartData, DashboardMetric, DashboardAlert } from '@modules/admin/interfaces/admin.interface';
import { UsersRepository } from '@modules/users/users.repository';

@Injectable()
export class AdminMetricsService {
  constructor (private readonly usersRepository: UsersRepository) {}

  async getDashboardMetrics (): Promise<{ metrics: DashboardMetric[]; charts: ChartData[]; alerts: DashboardAlert[] }> {
    const rawMetrics = await register.getMetricsAsJSON();
    const totalUsersCount = await this.usersRepository.count();

    const metrics: DashboardMetric[] = [
      {
        name: 'Total Users',
        value: totalUsersCount,
        timestamp: new Date().toISOString()
      }
    ];

    const charts: ChartData[] = [];

    for (const metric of rawMetrics) {
      if (metric.name === 'http_requests_total' && String(metric.type) === 'counter') {
        const totalRequests = metric.values.reduce((sum: number, val: MetricValue<string>) => {
          const path = (val.labels && (val.labels['path'] as string)) || '';
          return path.startsWith('/api') ? sum + val.value : sum;
        }, 0);

        metrics.push({
          name: 'Total HTTP Requests',
          value: totalRequests,
          timestamp: new Date().toISOString()
        });

        const requestsByStatus = metric.values.reduce(
          (acc: Record<string, number>, val: MetricValue<string>) => {
            const path = (val.labels && (val.labels['path'] as string)) || '';
            if (!path.startsWith('/api')) return acc;

            const status = (val.labels && (val.labels['status'] as string)) || 'unknown';
            acc[status] = (acc[status] || 0) + val.value;
            return acc;
          },
          {} as Record<string, number>
        );

        charts.push({
          title: 'Requests by Status Code',
          type: 'pie',
          data: Object.entries(requestsByStatus).map(([label, value]) => ({ label, value: value }))
        });
      }

      if (metric.name === 'http_request_duration_seconds' && String(metric.type) === 'histogram') {
        const buckets = metric.values.filter((v: MetricValue<string>) => {
          const metricValue = v as { metricName?: string };
          return metricValue.metricName?.includes('_bucket');
        });

        if (buckets.length > 0) {
          charts.push({
            title: 'Request Duration Distribution',
            type: 'bar',
            data: buckets.slice(0, 5).map((b: MetricValue<string>) => ({
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

    const alerts = this.generateAlerts(metrics);

    return { metrics, charts, alerts };
  }

  private generateAlerts (metrics: DashboardMetric[]): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];
    const now = new Date().toISOString();

    const cpuUsage = metrics.find(m => m.name === 'CPU Usage')?.value || 0;
    if (cpuUsage > 5.0) {
      alerts.push({
        title: 'High CPU Load',
        message: `System CPU usage is high (${cpuUsage.toFixed(2)}s). Check background tasks.`,
        type: 'warning',
        timestamp: now
      });
    }

    const memoryUsage = metrics.find(m => m.name === 'Memory Usage')?.value || 0;
    if (memoryUsage > 500) {
      alerts.push({
        title: 'Memory Pressure',
        message: `Node.js heap usage is crossing 500MB (${memoryUsage}MB).`,
        type: 'warning',
        timestamp: now
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        title: 'System Stable',
        message: 'All core services are performing within normal parameters.',
        type: 'info',
        timestamp: now
      });
    }

    return alerts;
  }
}
