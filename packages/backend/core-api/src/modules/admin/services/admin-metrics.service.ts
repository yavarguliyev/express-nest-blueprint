import {
  Injectable,
  RedisService,
  DatabaseService,
  StorageService,
  HealthService,
  QueryBuilder,
  HealthCheckStatus,
  nowISO,
  bytesToMB,
  mapOverall,
  KafkaService,
  MetricsService,
  METRIC_CONFIG,
  HealthComponentName,
  PromMetric,
  HEALTH_REGISTRY,
  DASHBOARD_CHARTS,
  ALERT_TEMPLATES,
  HealthRegistryItem,
  AlertTemplate,
  HealthCheckResult,
  DashboardChartConfig,
  QueueStatus,
  ComputeStatus,
  BaseHealthComponent,
  HealthComponentStatus
} from '@config/libs';

import {
  ChartData,
  DashboardMetric,
  DashboardAlert,
  DashboardMetricsResponse,
  DashboardMetricsContext
} from '@modules/admin/interfaces/admin.interface';
import { UsersRepository } from '@modules/users/users.repository';

@Injectable()
export class AdminMetricsService {
  constructor (
    private readonly usersRepository: UsersRepository,
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly storageService: StorageService,
    private readonly healthService: HealthService,
    private readonly kafkaService: KafkaService,
    private readonly metricsService: MetricsService
  ) {}

  public async getHealthStatus (): Promise<HealthCheckStatus> {
    const result = await this.healthService.checkHealth();

    return {
      overallStatus: mapOverall(result.status),
      timestamp: result.timestamp,
      components: Object.entries(result.components)
        .filter((entry): entry is [string, BaseHealthComponent] => !!entry[1])
        .map(
          ([k, v]): HealthComponentStatus => ({
            name: k as HealthComponentName,
            status: v.status,
            details: v
          })
        )
    };
  }

  public async getDashboardMetrics (): Promise<DashboardMetricsResponse> {
    const timestamp = nowISO();
    const settledResults = await Promise.allSettled([
      this.metricsService.getMetricsAsJSON(),
      this.usersRepository.count(),
      this.redisService.getMemoryUsage(),
      this.storageService.getTotalUsage(),
      this.kafkaService.getKafkaMetrics(),
      this.healthService.checkHealth(),
      this.databaseService
        .getConnection()
        .query(QueryBuilder.buildDatabaseSizeQuery())
        .catch(() => ({ rows: [] }))
    ]);

    const getVal = <T>(idx: number, fallback: T): T => {
      const res = settledResults[idx];
      return res?.status === 'fulfilled' ? (res as PromiseFulfilledResult<T>).value : fallback;
    };

    const kafkaMetrics = getVal<{ messagesInPerSec: number; underReplicatedPartitions: number }>(4, {
      messagesInPerSec: 0,
      underReplicatedPartitions: 0
    });

    const rawMetrics = getVal<PromMetric[]>(0, []);
    const healthResult = getVal<HealthCheckResult>(5, { status: 'down', timestamp, components: {} });
    const dbQueryResults = getVal<{ rows: { size: string }[] }>(6, { rows: [] });

    const context: DashboardMetricsContext = { rawMetrics, healthResult, kafkaMetrics, dbQueryResults, getVal };

    const metrics: DashboardMetric[] = (Object.values(HEALTH_REGISTRY) as HealthRegistryItem[]).map(
      (reg): DashboardMetric => ({
        name: reg.name,
        value: this.resolveMetricValue(reg, context),
        unit: reg.unit ?? '',
        timestamp
      })
    );

    const charts: ChartData[] = (Object.values(DASHBOARD_CHARTS) as DashboardChartConfig[]).map(
      (config): ChartData => ({
        title: config.title,
        type: config.type,
        data: this.resolveChartData(config, rawMetrics)
      })
    );

    return { metrics, charts, alerts: this.generateAlerts(metrics) };
  }

  private resolveChartData (config: DashboardChartConfig, rawMetrics: PromMetric[]): { label: string; value: number }[] {
    const metric = rawMetrics.find((m): boolean => m.name === config.metric);
    if (!metric) return [];

    if (config.metric === METRIC_CONFIG.NAMES.HTTP_DURATION) {
      return metric.values
        .slice(0, 5)
        .map((v): { label: string; value: number } => ({ label: `${String(v.labels?.['le'] || 'inf')}s`, value: v.value }));
    }

    if (config.metric === METRIC_CONFIG.NAMES.HTTP_TOTAL) {
      const stats = metric.values
        .filter((v): boolean => (v.labels?.['path'] as string)?.startsWith('/api'))
        .reduce((acc: Record<string, number>, v): Record<string, number> => {
          const status = String(v.labels?.['status'] || 'unk');
          acc[status] = (acc[status] || 0) + v.value;
          return acc;
        }, {});

      return Object.entries(stats).map(([label, value]): { label: string; value: number } => ({ label, value }));
    }

    return [];
  }

  private generateAlerts (metrics: DashboardMetric[]): DashboardAlert[] {
    const ts = nowISO();
    const t = ALERT_TEMPLATES.THRESHOLD_EXCEEDED as AlertTemplate;
    const s = ALERT_TEMPLATES.SYSTEM_STABLE as AlertTemplate;

    const alerts = (Object.values(HEALTH_REGISTRY) as HealthRegistryItem[])
      .filter((r): boolean => !!(r.threshold && (metrics.find((m): boolean => m.name === r.name)?.value || 0) > r.threshold))
      .map(
        (r): DashboardAlert => ({
          header: t.header,
          title: t.title(r.name),
          type: 'warning' as const,
          timestamp: ts,
          message: t.message(r.name, metrics.find((m): boolean => m.name === r.name)!.value, r.unit || '', r.precision)
        })
      );

    return alerts.length ? alerts : [{ header: s.header, title: s.title(''), message: s.message('', 0, ''), type: 'info' as const, timestamp: ts }];
  }

  private resolveMetricValue (reg: HealthRegistryItem, ctx: DashboardMetricsContext): number {
    switch (reg.key) {
      case 'database':
        return bytesToMB(parseInt(String(ctx.dbQueryResults.rows[0]?.size || '0'), 10));
      case 'redis':
        return bytesToMB(ctx.getVal<number>(2, 0));
      case 'storage':
        return bytesToMB(ctx.getVal<number>(3, 0));
      case 'kafka':
        return reg.name.includes('Usage') ? ctx.kafkaMetrics.messagesInPerSec : ctx.kafkaMetrics.underReplicatedPartitions;
      case 'users':
        return ctx.getVal<number>(1, 0);
      case 'queues':
        return (ctx.healthResult.components.queues as QueueStatus)?.items?.length || 0;
      case 'compute workers':
        return (ctx.healthResult.components['compute workers'] as ComputeStatus)?.pendingJobsCount || 0;
      case 'CPU':
        return this.metricsService.getCpuUsagePercentage();
      default:
        if (reg.promMetric) {
          const metric = ctx.rawMetrics.find((m): boolean => m.name === reg.promMetric);
          if (reg.key === 'Memory') return bytesToMB(metric?.values[0]?.value || 0);
          return metric?.values.reduce((sum: number, v): number => sum + v.value, 0) || 0;
        }

        return 0;
    }
  }
}
