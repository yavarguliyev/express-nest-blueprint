import { Request, Response, NextFunction } from 'express';

import { Injectable } from '@common/decorators';
import { NestMiddleware } from '@common/interfaces';
import { MetricsService } from '@core/metrics/metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor (private readonly metricsService: MetricsService) {}

  use (req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const { method, path } = req;

    this.metricsService.incActiveRequests();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const statusCode = res.statusCode.toString();

      this.metricsService.incRequests(method, path, statusCode);
      this.metricsService.observeDuration(method, path, statusCode, duration);
      this.metricsService.decActiveRequests();
    });

    next();
  }
}
