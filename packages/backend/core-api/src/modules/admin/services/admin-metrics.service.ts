import {
  Injectable,
  HealthCheckStatus,
  nowISO,
  mapOverall,
  HealthComponentName,
  PromMetric,
  HealthCheckResult,
  BaseHealthComponent,
  HealthComponentStatus,
  HealthRegistryItem,
  DashboardChartConfig,
  RedisService,
  DatabaseService,
  StorageService,
  HealthService,
  ConfigService,
  QueryBuilder,
  KafkaService,
  MetricsService,
  PrometheusQueryResponse
} from '@config/libs';

import {
  DashboardMetricsResponse,
  DashboardMetricsContext,
  DashboardMetric,
  DashboardAlert,
  HealthLogEntry
} from '@modules/admin/interfaces/admin.interface';
import { UsersRepository } from '@modules/users/users.repository';
import { DashboardMetricsBuilder } from '@modules/admin/services/metrics/dashboard-metrics';
import { MetricResolver } from '@modules/admin/services/metrics/metric-resolver';
import { MetricCalculators } from '@modules/admin/services/metrics/metric-calculators';
import { DashboardMetricResolver } from '@modules/admin/interfaces/admin-dashboard-metrics.interface';

@Injectable()
export class AdminMetricsService {
  constructor (
    private readonly usersRepository: UsersRepository,
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly storageService: StorageService,
    private readonly healthService: HealthService,
    private readonly kafkaService: KafkaService,
    private readonly metricsService: MetricsService,
    private readonly configService: ConfigService,
    private readonly dashboardBuilder: DashboardMetricsBuilder,
    private readonly metricResolver: MetricResolver,
    private readonly metricCalculators: MetricCalculators
  ) {}

  async getHealthStatus (): Promise<HealthCheckStatus> {
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

  async getDashboardMetrics (): Promise<DashboardMetricsResponse> {
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
        .catch(() => ({ rows: [] })),
      this.getPrometheusTotalHttpRequests()
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
    const totalHttpRequests = getVal<number | undefined>(7, undefined);
    const context: DashboardMetricsContext = { rawMetrics, healthResult, kafkaMetrics, dbQueryResults, totalHttpRequests, getVal };
    const resolver: DashboardMetricResolver = {
      context,
      resolveMetricValue: (reg: HealthRegistryItem, ctx: DashboardMetricsContext): number => {
        return this.metricResolver.resolveMetricValue(reg, ctx);
      },
      resolveChartData: (config: DashboardChartConfig, rawMetrics: PromMetric[]): { label: string; value: number }[] => {
        return this.metricCalculators.resolveChartData(config, rawMetrics);
      },
      generateAlerts: (metrics: DashboardMetric[]): DashboardAlert[] => {
        return this.metricCalculators.generateAlerts(metrics);
      }
    };
    return this.dashboardBuilder.buildDashboardMetrics(resolver);
  }

  async getHealthLogs (): Promise<HealthLogEntry[]> {
    const result = await this.healthService.checkHealth();
    const timestamp = result.timestamp || nowISO();
    const entries = Object.entries(result.components)
      .filter((entry): entry is [string, BaseHealthComponent] => !!entry[1])
      .map(([name, comp]): HealthLogEntry => {
        const status = comp.status;
        const level = status === 'up' ? 'success' : status === 'degraded' ? 'warn' : 'error';
        return { timestamp, level, message: `${name} status ${status}` };
      });
    if (entries.length > 0) return entries;
    return [{ timestamp, level: 'info', message: `health status ${result.status}` }];
  }

  private async getPrometheusTotalHttpRequests (): Promise<number | undefined> {
    try {
      const baseUrl = this.configService.get<string>('PROMETHEUS_URL', 'http://prometheus:9090');
      const query = 'sum(http_requests_total{path=~"/api/.*"})';
      const url = `${baseUrl}/api/v1/query?query=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) return undefined;
      const data = (await res.json()) as PrometheusQueryResponse;
      const value = data?.data?.result?.[0]?.value?.[1];
      const parsed = typeof value === 'string' ? Number(value) : undefined;
      return Number.isFinite(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
}
