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
  KafkaService,
  MetricsService,
  METRIC_CONFIG,
  HealthComponentName,
  PromMetric,
  BaseHealthComponent,
  QueueStatus,
  ComputeStatus
} from '@config/libs';

import { ChartData, DashboardMetric, DashboardAlert, DashboardMetricsResponse } from '@modules/admin/interfaces/admin.interface';
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

  public async getDashboardMetrics (): Promise<DashboardMetricsResponse> {
    const {
      DATABASE: DB,
      REDIS: R,
      KAFKA_MESSA_PER_SEC: K,
      KAFKA_UNDER_REPLICATION: KUR,
      S3_BUCKET_STORAGE: S,
      CPU,
      MEMORY,
      QUEUES,
      COMPUTE_WORKERS
    } = HEALTH_CHECKS;
    const { METRICS, HISTOGRAM, CPU_USAGE, MEMORY_USAGE } = CHART_DATA;

    const ts: string = nowISO();

    const [rawRes, usersRes, redisRes, storageRes, kafkaRes, healthRes] = await Promise.allSettled([
      this.metricsService.getMetricsAsJSON(),
      this.usersRepository.count(),
      this.redisService.getMemoryUsage(),
      this.storageService.getTotalUsage(),
      this.kafkaService.getKafkaMetrics(),
      this.healthService.checkHealth()
    ]);

    const raw: PromMetric[] = rawRes.status === 'fulfilled' ? rawRes.value : [];
    const users: number = usersRes.status === 'fulfilled' ? usersRes.value : 0;
    const rB: number = redisRes.status === 'fulfilled' ? redisRes.value : 0;
    const sB: number = storageRes.status === 'fulfilled' ? storageRes.value : 0;
    const kf: { messagesInPerSec: number; underReplicatedPartitions: number } =
      kafkaRes.status === 'fulfilled' ? kafkaRes.value : { messagesInPerSec: 0, underReplicatedPartitions: 0 };
    const h: HealthCheckResult = healthRes.status === 'fulfilled' ? healthRes.value : { status: 'down', timestamp: ts, components: {} };

    let dbMB = 0;

    try {
      const dR: { rows: { size: string }[] } = await this.databaseService.getConnection().query(QueryBuilder.buildDatabaseSizeQuery());
      dbMB = bytesToMB(parseInt(dR.rows[0]?.size || '0', 10));
    } catch {
      dbMB = 0;
    }

    const metricsMap = new Map<string, DashboardMetric>();
    const initialMetrics: DashboardMetric[] = [
      { name: DB.usage, value: dbMB, unit: DB.unit, timestamp: ts },
      { name: R.usage, value: bytesToMB(rB), unit: R.unit, timestamp: ts },
      { name: S.usage, value: bytesToMB(sB), unit: S.unit, timestamp: ts },
      { name: K.usage, value: kf.messagesInPerSec, unit: K.unit, timestamp: ts },
      { name: KUR.usage, value: kf.underReplicatedPartitions, unit: KUR.unit, timestamp: ts },
      { name: DASHBOARD_METRICS.USERS.name, value: users, timestamp: ts },
      { name: CPU.usage, value: 0, unit: CPU.unit, timestamp: ts },
      { name: MEMORY.usage, value: 0, unit: MEMORY.unit, timestamp: ts },
      { name: METRICS.name, value: 0, timestamp: ts },
      {
        name: QUEUES.usage,
        value: (h.components.queues as QueueStatus | undefined)?.items?.length || 0,
        unit: QUEUES.unit,
        timestamp: ts
      },
      {
        name: COMPUTE_WORKERS.usage,
        value: (h.components['compute workers'] as ComputeStatus | undefined)?.pendingJobsCount || 0,
        unit: COMPUTE_WORKERS.unit,
        timestamp: ts
      }
    ];
    initialMetrics.forEach(m => metricsMap.set(m.name, m));

    const charts: ChartData[] = [];
    for (const m of raw) {
      if (m.name === HISTOGRAM.is_http_request_duration_seconds) {
        charts.push({
          title: HISTOGRAM.title,
          type: 'bar',
          data: m.values.slice(0, 5).map((v: PromMetric['values'][0]) => ({
            label: `${String(v.labels?.[HISTOGRAM.type[2]] || HISTOGRAM.type[3])}${METRIC_CONFIG.LABELS.TIME_SUFFIX}`,
            value: v.value
          }))
        });
      }

      const cpuKey = CPU.usage;
      if ((m.name === CPU_USAGE.is_process_cpu_user_seconds_total || m.name === METRIC_CONFIG.NAMES.FALLBACK_CPU) && metricsMap.has(cpuKey)) {
        metricsMap.get(cpuKey)!.value = this.metricsService.getCpuUsagePercentage();
      }

      const memKey = MEMORY.usage;
      if ((m.name === MEMORY_USAGE.is_nodejs_heap_size_used_bytes || m.name === METRIC_CONFIG.NAMES.FALLBACK_MEM) && metricsMap.has(memKey)) {
        metricsMap.get(memKey)!.value = bytesToMB(m.values[0]?.value || 0);
      }

      const httpKey = METRICS.name;
      if (m.name === METRICS.is_http_requests_total && metricsMap.has(httpKey)) {
        const reqs: PromMetric['values'] = m.values.filter((v: PromMetric['values'][0]) =>
          (v.labels?.[METRICS.label[0]] as string)?.startsWith(METRICS.path_starts_with)
        );
        const total: number = reqs.reduce((s: number, v: PromMetric['values'][0]) => s + v.value, 0);
        const byStatus: Record<string, number> = reqs.reduce(
          (acc: Record<string, number>, v: PromMetric['values'][0]) => {
            const s: string = (v.labels?.[METRICS.label[1]] as string) || METRIC_CONFIG.LABELS.UNKNOWN;
            acc[s] = (acc[s] || 0) + v.value;
            return acc;
          },
          {} as Record<string, number>
        );

        metricsMap.get(httpKey)!.value = total;
        charts.push({
          title: METRICS.title,
          type: 'pie',
          data: Object.entries(byStatus).map(([label, value]: [string, number]) => ({ label, value }))
        });
      }
    }

    const metrics = Array.from(metricsMap.values());
    return { metrics, charts, alerts: this.generateAlerts(metrics) };
  }

  private generateAlerts (metrics: DashboardMetric[]): DashboardAlert[] {
    const ts: string = nowISO();
    const alerts: DashboardAlert[] = Object.values(DASHBOARD_METRICS)
      .filter(
        (c: { alertThreshold: number | null; name: string }) =>
          c.alertThreshold && (metrics.find(m => m.name === c.name)?.value || 0) > c.alertThreshold
      )
      .map((c: { name: string }) => {
        const met: DashboardMetric = metrics.find(metric => metric.name === c.name)!;
        return {
          header: ALERT_TEMPLATES.THRESHOLD_EXCEEDED.header,
          title: ALERT_TEMPLATES.THRESHOLD_EXCEEDED.title(c.name),
          message: ALERT_TEMPLATES.THRESHOLD_EXCEEDED.message(c.name, met.value, met.unit || ''),
          type: 'warning',
          timestamp: ts
        };
      });

    return alerts.length
      ? alerts
      : [
          {
            header: ALERT_TEMPLATES.SYSTEM_STABLE.header,
            title: ALERT_TEMPLATES.SYSTEM_STABLE.title,
            message: ALERT_TEMPLATES.SYSTEM_STABLE.message,
            type: 'info',
            timestamp: ts
          }
        ];
  }

  public async getHealthStatus (): Promise<HealthCheckStatus> {
    const h: HealthCheckResult = await this.healthService.checkHealth();
    const components: HealthComponentStatus[] = [];
    const entries: [string, BaseHealthComponent | undefined][] = Object.entries(h.components);

    for (const [k, v] of entries) {
      if (v) {
        components.push({
          name: k as HealthComponentName,
          status: v.status,
          details: v
        });
      }
    }

    return { overallStatus: mapOverall(h.status), timestamp: h.timestamp, components };
  }
}
