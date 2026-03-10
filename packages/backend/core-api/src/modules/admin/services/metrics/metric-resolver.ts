import { Injectable, bytesToMB, HealthRegistryItem, QueueStatus, ComputeStatus, MetricsService } from '@config/libs';

import { DashboardMetricsContext } from '@modules/admin/interfaces/admin.interface';

@Injectable()
export class MetricResolver {
  constructor (private readonly metricsService: MetricsService) {}

  resolveMetricValue (reg: HealthRegistryItem, ctx: DashboardMetricsContext): number {
    if (reg.key === 'database') return this.resolveDatabaseMetric(ctx);
    if (reg.key === 'redis') return this.resolveRedisMetric(ctx);
    if (reg.key === 'storage') return this.resolveStorageMetric(ctx);
    if (reg.key === 'kafka') return this.resolveKafkaMetric(reg, ctx);
    if (reg.key === 'users') return this.resolveUsersMetric(ctx);
    if (reg.key === 'queues') return this.resolveQueuesMetric(ctx);
    if (reg.key === 'compute workers') return this.resolveComputeWorkersMetric(ctx);
    if (reg.key === 'http' && typeof ctx.totalHttpRequests === 'number') return ctx.totalHttpRequests;
    if (reg.key === 'CPU') return this.resolveCpuMetric();
    if (reg.promMetric) return this.resolvePromMetric(reg, ctx);

    return 0;
  }

  private resolveDatabaseMetric = (ctx: DashboardMetricsContext): number => bytesToMB(parseInt(String(ctx.dbQueryResults.rows[0]?.size || '0'), 10));
  private resolveRedisMetric = (ctx: DashboardMetricsContext): number => bytesToMB(ctx.getVal<number>(2, 0));
  private resolveStorageMetric = (ctx: DashboardMetricsContext): number => bytesToMB(ctx.getVal<number>(3, 0));
  private resolveUsersMetric = (ctx: DashboardMetricsContext): number => ctx.getVal<number>(1, 0);
  private resolveQueuesMetric = (ctx: DashboardMetricsContext): number => (ctx.healthResult.components.queues as QueueStatus)?.items?.length || 0;
  private resolveCpuMetric = (): number => this.metricsService.getCpuUsagePercentage();

  private resolveKafkaMetric (reg: HealthRegistryItem, ctx: DashboardMetricsContext): number {
    return reg.name.includes('Usage') ? ctx.kafkaMetrics.messagesInPerSec : ctx.kafkaMetrics.underReplicatedPartitions;
  }

  private resolveComputeWorkersMetric (ctx: DashboardMetricsContext): number {
    return (ctx.healthResult.components['compute workers'] as ComputeStatus)?.pendingJobsCount || 0;
  }

  private resolvePromMetric (reg: HealthRegistryItem, ctx: DashboardMetricsContext): number {
    const metric = ctx.rawMetrics.find((m): boolean => m.name === reg.promMetric);
    if (reg.key === 'Memory') return bytesToMB(metric?.values[0]?.value || 0);
    return metric?.values.reduce((sum: number, v): number => sum + v.value, 0) || 0;
  }
}
