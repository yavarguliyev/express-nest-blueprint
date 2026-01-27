import { Response } from 'express';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

import { Injectable } from '../../core/decorators/injectable.decorator';

@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDurationSeconds: Histogram<string>;
  private readonly activeRequests: Gauge<string>;

  constructor () {
    collectDefaultMetrics({ register });

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status']
    });

    this.httpRequestDurationSeconds = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5]
    });

    this.activeRequests = new Gauge({
      name: 'http_active_requests_total',
      help: 'Total number of active HTTP requests'
    });
  }

  getMetrics (res: Response): Promise<string> {
    const metrics = register.metrics();
    res.set('Content-Type', this.getContentType());
    return metrics;
  }

  incRequests (method: string, path: string, status: string): void {
    this.httpRequestsTotal.inc({ method, path, status });
  }

  observeDuration (method: string, path: string, status: string, duration: number): void {
    this.httpRequestDurationSeconds.observe({ method, path, status }, duration);
  }

  incActiveRequests (): void {
    this.activeRequests.inc();
  }

  decActiveRequests (): void {
    this.activeRequests.dec();
  }

  private getContentType (): string {
    return register.contentType;
  }
}
