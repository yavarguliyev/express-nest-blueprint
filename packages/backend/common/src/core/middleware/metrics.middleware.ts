import { Request, Response, NextFunction } from 'express';

import { Injectable } from '../decorators/injectable.decorator';
import { NestMiddleware } from '../../domain/interfaces/nest/middleware.interface';
import { MetricsService } from '../../infrastructure/metrics/metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  private readonly staticExtensions = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot|map|json)$/i;

  constructor (private readonly metricsService: MetricsService) {}

  use (req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const method = req.method || 'GET';
    const path = (req.originalUrl || req.path || '').split('?')[0] || '/';

    if (this.staticExtensions.test(path) || path.includes('/metrics') || path.includes('/health')) return next();

    this.metricsService.incActiveRequests();

    let finished = false;

    const cleanup = (): void => {
      if (finished) return;

      finished = true;

      const duration = (Date.now() - start) / 1000;
      const statusCode = res.statusCode.toString();

      this.metricsService.incRequests(method, path, statusCode);
      this.metricsService.observeDuration(method, path, statusCode, duration);
      this.metricsService.decActiveRequests();
    };

    res.on('finish', cleanup);
    res.on('close', cleanup);

    next();
  }
}
