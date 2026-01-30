import { register, MetricValue } from 'prom-client';

import {
  Injectable,
  RedisService,
  DatabaseService,
  StorageService,
  HealthService,
  QueryBuilder,
  HealthCheckResult,
  HealthCheckStatus,
  HealthComponentStatus,
  HEALTH_CHECKS,
  nowISO,
  bytesToMB,
  CHART_DATA,
  DASHBOARD_METRICS,
  ALERT_TEMPLATES,
  mapOverall,
  KafkaService
} from '@config/libs';

import { ChartData, DashboardMetric, DashboardAlert } from '@modules/admin/interfaces/admin.interface';
import { UsersRepository } from '@modules/users/users.repository';

@Injectable()
export class AdminMetricsService {
  constructor (
    private readonly usersRepository: UsersRepository,
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly storageService: StorageService,
    private readonly healthService: HealthService,
    private readonly kafkaService: KafkaService
  ) {}

  async getDashboardMetrics (): Promise<{ metrics: DashboardMetric[]; charts: ChartData[]; alerts: DashboardAlert[] }> {
    const { DATABASE, REDIS, KAFKA_MESSA_PER_SEC, S3_BUCKET_STORAGE } = HEALTH_CHECKS;
    const { METRICS, HISTOGRAM, CPU_USAGE, MEMORY_USAGE } = CHART_DATA;

    const timestamp = nowISO();

    const rawMetrics = await register.getMetricsAsJSON();
    const totalUsersCount = await this.usersRepository.count();

    const metrics: DashboardMetric[] = [];

    const dbResult = await this.databaseService.getConnection().query(QueryBuilder.buildDatabaseSizeQuery());
    const dbSize = dbResult.rows[0] as { size: string };
    const dbSizeMB = bytesToMB(parseInt(dbSize.size, 10));
    const redisUsedMB = bytesToMB(await this.redisService.getMemoryUsage());
    const storageMB = bytesToMB(await this.storageService.getTotalUsage());
    const totalUsers = { name: DASHBOARD_METRICS.USERS.name, value: totalUsersCount, timestamp };

    const { messagesInPerSec } = await this.kafkaService.getKafkaMetrics();

    metrics.push({ name: DATABASE.usage, value: dbSizeMB, unit: DATABASE.unit, timestamp });
    metrics.push({ name: REDIS.usage, value: redisUsedMB, unit: REDIS.unit, timestamp });
    metrics.push({ name: S3_BUCKET_STORAGE.usage, value: storageMB, unit: S3_BUCKET_STORAGE.unit, timestamp });
    metrics.push({ name: KAFKA_MESSA_PER_SEC.usage, value: messagesInPerSec, unit: KAFKA_MESSA_PER_SEC.unit, timestamp });

    const charts: ChartData[] = [];

    for (const metric of rawMetrics) {
      if (metric.name === HISTOGRAM.is_http_request_duration_seconds && String(metric.type) === HISTOGRAM.name) {
        const buckets = metric.values.filter((v: MetricValue<string>) => {
          const metricValue = v as { metricName?: string };
          return metricValue.metricName?.includes(HISTOGRAM.type[0]);
        });

        if (buckets.length > 0) {
          charts.push({
            title: HISTOGRAM.title,
            type: HISTOGRAM.type[1],
            data: buckets.slice(0, 5).map((b: MetricValue<string>) => ({
              label: `${(b.labels && b.labels[HISTOGRAM.type[2]]) || HISTOGRAM.type[3]}s`,
              value: b.value
            }))
          });
        }
      }

      if (metric.name === CPU_USAGE.is_process_cpu_user_seconds_total) {
        metrics.push({
          name: CPU_USAGE.name,
          value: metric.values[0]?.value ?? 0,
          unit: CPU_USAGE.type[0],
          timestamp
        });
      }

      if (metric.name === MEMORY_USAGE.is_nodejs_heap_size_used_bytes) {
        metrics.push({
          name: MEMORY_USAGE.name,
          value: bytesToMB(metric.values[0]?.value ?? 0),
          unit: MEMORY_USAGE.type[0],
          timestamp
        });
      }

      if (metric.name === METRICS.is_http_requests_total && String(metric.type) === METRICS.type[0]) {
        const totalRequests = metric.values.reduce((sum: number, val: MetricValue<string>) => {
          const path = (val.labels && (val.labels[METRICS.label[0]] as string)) || '';
          return path.startsWith(METRICS.path_starts_with) ? sum + val.value : sum;
        }, 0);

        metrics.push({ name: METRICS.name, value: totalRequests, timestamp });

        const requestsByStatus = metric.values.reduce(
          (acc: Record<string, number>, val: MetricValue<string>) => {
            const path = (val.labels && (val.labels[METRICS.label[0]] as string)) || '';
            if (!path.startsWith(METRICS.path_starts_with)) return acc;
            const status = (val.labels && (val.labels[METRICS.label[1]] as string)) || 'unknown';
            acc[status] = (acc[status] || 0) + val.value;
            return acc;
          },
          {} as Record<string, number>
        );

        const data = Object.entries(requestsByStatus).map(([label, value]) => ({ label, value: value }));
        charts.push({ title: METRICS.title, type: METRICS.type[1], data });
      }
    }

    metrics.push(totalUsers);

    const alerts = this.generateAlerts(metrics);

    return { metrics, charts, alerts };
  }

  private generateAlerts (metrics: DashboardMetric[]): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];
    const timestamp = nowISO();

    (Object.values(DASHBOARD_METRICS) as Array<{ name: string; alertThreshold: number | null }>).forEach(metricConfig => {
      if (!metricConfig.alertThreshold) return;

      const metricValue = metrics.find(m => m.name === metricConfig.name)?.value ?? 0;
      const metricUnit = HEALTH_CHECKS[metricConfig.name as keyof typeof HEALTH_CHECKS]?.unit ?? '';

      if (metricValue > metricConfig.alertThreshold) {
        alerts.push({
          header: ALERT_TEMPLATES.THRESHOLD_EXCEEDED.header,
          title: ALERT_TEMPLATES.THRESHOLD_EXCEEDED.title(metricConfig.name),
          message: ALERT_TEMPLATES.THRESHOLD_EXCEEDED.message(metricConfig.name, metricValue, metricUnit),
          type: ALERT_TEMPLATES.THRESHOLD_EXCEEDED.type,
          timestamp
        });
      }
    });

    if (alerts.length === 0) {
      alerts.push({
        header: ALERT_TEMPLATES.SYSTEM_STABLE.header,
        title: ALERT_TEMPLATES.SYSTEM_STABLE.title,
        message: ALERT_TEMPLATES.SYSTEM_STABLE.message,
        type: ALERT_TEMPLATES.SYSTEM_STABLE.type,
        timestamp
      });
    }

    return alerts;
  }

  async getHealthStatus (): Promise<HealthCheckStatus> {
    const health: HealthCheckResult = await this.healthService.checkHealth();
    const components: HealthComponentStatus[] = [];

    if (health.components.database) {
      components.push({
        name: HEALTH_CHECKS.DATABASE.key,
        status: health.components.database.status,
        details: health.components.database
      });
    }

    if (health.components.redis) {
      components.push({
        name: HEALTH_CHECKS.REDIS.key,
        status: health.components.redis.status,
        details: health.components.redis
      });
    }

    if (health.components?.queues) {
      components.push({
        name: HEALTH_CHECKS.QUEUES.key,
        status: health.components.queues.status,
        details: health.components.queues
      });
    }

    if (health.components['compute workers']) {
      components.push({
        name: HEALTH_CHECKS.COMPUTE_WORKERS.key,
        status: health.components['compute workers'].status,
        details: health.components['compute workers']
      });
    }

    if (health.components.kafka) {
      components.push({
        name: HEALTH_CHECKS.KAFKA_MESSA_PER_SEC.key,
        status: health.components.kafka.status,
        details: health.components.kafka
      });
    }

    if (health.components.storage) {
      components.push({
        name: HEALTH_CHECKS.S3_BUCKET_STORAGE.key,
        status: health.components.storage.status,
        details: health.components.storage
      });
    }

    return {
      overallStatus: mapOverall(health.status),
      timestamp: health.timestamp,
      components
    };
  }
}
