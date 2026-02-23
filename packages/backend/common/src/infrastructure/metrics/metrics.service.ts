import { Response } from 'express';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import gcStats from 'prometheus-gc-stats';

import { METRIC_CONFIG } from '../../domain/constants/health/health-check.const';
import { PromMetric } from '../../domain/interfaces/infra/metrics.interface';
import { Injectable } from '../../core/decorators/injectable.decorator';

@Injectable()
export class MetricsService {
  private readonly metrics: {
    httpTotal: Counter<string>;
    httpDuration: Histogram<string>;
    activeReqs: Gauge<string>;
    cacheTotal: Counter<string>;
    cacheRatio: Gauge<string>;
    dbDuration: Histogram<string>;
    dbActive: Gauge<string>;
    kafkaTotal: Counter<string>;
    kafkaDuration: Histogram<string>;
    s3Total: Counter<string>;
    s3Duration: Histogram<string>;
  };

  private prevCpuUsage = process.cpuUsage();
  private prevTime = process.hrtime.bigint();

  constructor () {
    const { NAMES: N, LABELS: L, BUCKETS: B } = METRIC_CONFIG;
    collectDefaultMetrics({ register, eventLoopMonitoringPrecision: 10 });
    gcStats(register)();

    const common = { labelNames: [L.METHOD, L.PATH, L.STATUS] };
    this.metrics = {
      httpTotal: new Counter({ name: N.HTTP_TOTAL, help: 'HTTP total', ...common }),
      httpDuration: new Histogram({ name: N.HTTP_DURATION, help: 'HTTP duration', ...common, buckets: [...B.HTTP] }),
      activeReqs: new Gauge({ name: N.HTTP_ACTIVE, help: 'Active HTTP' }),
      cacheTotal: new Counter({ name: N.CACHE_TOTAL, help: 'Cache total', labelNames: [L.OPERATION, L.RESULT] }),
      cacheRatio: new Gauge({ name: N.CACHE_RATIO, help: 'Cache ratio' }),
      dbDuration: new Histogram({ name: N.DB_DURATION, help: 'DB duration', labelNames: [L.QUERY, L.TABLE], buckets: [...B.DB] }),
      dbActive: new Gauge({ name: N.DB_ACTIVE, help: 'Active DB' }),
      kafkaTotal: new Counter({ name: N.KAFKA_TOTAL, help: 'Kafka total', labelNames: [L.TOPIC, L.GROUP, L.RESULT] }),
      kafkaDuration: new Histogram({ name: N.KAFKA_DURATION, help: 'Kafka duration', labelNames: [L.TOPIC, L.GROUP], buckets: [...B.KAFKA] }),
      s3Total: new Counter({ name: N.S3_TOTAL, help: 'S3 total', labelNames: [L.OPERATION, L.RESULT] }),
      s3Duration: new Histogram({ name: N.S3_DURATION, help: 'S3 duration', labelNames: [L.OPERATION], buckets: [...B.S3] })
    };
  }

  getRegistry = (): typeof register => register;
  incRequests = (m: string, p: string, s: string): void => this.metrics.httpTotal.inc({ method: m, path: p, status: s });
  observeDuration = (m: string, p: string, s: string, d: number): void => this.metrics.httpDuration.observe({ method: m, path: p, status: s }, d);
  incActiveRequests = (): void => this.metrics.activeReqs.inc();
  decActiveRequests = (): void => this.metrics.activeReqs.dec();
  recordCacheOperation = (o: string, r: string): void => this.metrics.cacheTotal.inc({ operation: o, result: r });
  updateCacheHitRatio = (r: number): void => this.metrics.cacheRatio.set(r);
  observeDatabaseQuery = (q: string, t: string, d: number): void => this.metrics.dbDuration.observe({ query_type: q, table: t }, d);
  setDatabaseConnections = (c: number): void => this.metrics.dbActive.set(c);
  recordKafkaMessage = (t: string, g: string, r: string): void => this.metrics.kafkaTotal.inc({ topic: t, consumer_group: g, result: r });
  observeKafkaProcessing = (t: string, g: string, d: number): void => this.metrics.kafkaDuration.observe({ topic: t, consumer_group: g }, d);
  recordS3Operation = (o: string, r: string): void => this.metrics.s3Total.inc({ operation: o, result: r });
  observeS3Operation = (o: string, d: number): void => this.metrics.s3Duration.observe({ operation: o }, d);
  getMetricsAsJSON = async (): Promise<PromMetric[]> => (await register.getMetricsAsJSON()) as unknown as PromMetric[];

  getMetrics (res: Response): Promise<string> {
    res.set('Content-Type', register.contentType);
    return register.metrics();
  }

  getCpuUsagePercentage (): number {
    const currCpu = process.cpuUsage();
    const currTime = process.hrtime.bigint();

    const elapCpu = process.cpuUsage(this.prevCpuUsage);
    const elapTime = Number(currTime - this.prevTime) / 1000;

    const totalElapCpu = elapCpu.user + elapCpu.system;
    const cpuPercent = elapTime > 0 ? (totalElapCpu / elapTime) * 100 : 0;

    this.prevCpuUsage = currCpu;
    this.prevTime = currTime;

    return parseFloat(cpuPercent.toFixed(2));
  }
}
