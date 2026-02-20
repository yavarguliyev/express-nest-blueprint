import {
  Injectable,
  RedisService,
  DatabaseService,
  StorageService,
  HealthService,
  QueryBuilder,
  HealthCheckStatus,
  nowISO,
  mapOverall,
  KafkaService,
  MetricsService,
  HealthComponentName,
  PromMetric,
  HealthCheckResult,
  BaseHealthComponent,
  HealthComponentStatus
} from '@config/libs';

import { DashboardMetricsResponse, DashboardMetricsContext } from '@modules/admin/interfaces/admin.interface';
import { UsersRepository } from '@modules/users/users.repository';
import { DashboardMetricsBuilder } from '@modules/admin/services/metrics/dashboard-metrics';
import { MetricResolver } from '@modules/admin/services/metrics/metric-resolver';
import { MetricCalculators } from '@modules/admin/services/metrics/metric-calculators';

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
    private readonly dashboardBuilder: DashboardMetricsBuilder,
    private readonly metricResolver: MetricResolver,
    private readonly metricCalculators: MetricCalculators
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

    return this.dashboardBuilder.buildDashboardMetrics(
      context,
      (reg, ctx) => this.metricResolver.resolveMetricValue(reg, ctx),
      (config, metrics) => this.metricCalculators.resolveChartData(config, metrics),
      metrics => this.metricCalculators.generateAlerts(metrics)
    );
  }
}
