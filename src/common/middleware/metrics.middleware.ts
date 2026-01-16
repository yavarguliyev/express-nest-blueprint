import { Request, Response, NextFunction } from 'express';

import { Injectable } from '@common/decorators/injectable.decorator';
import { NestMiddleware } from '@common/interfaces/middleware.interface';
import { MetricsService } from '@core/metrics/metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor (private readonly metricsService: MetricsService) {}

  use (req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const { method } = req;
    const path = (req.originalUrl || req.path).split('?')[0];

    this.metricsService.incActiveRequests();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const statusCode = res.statusCode.toString();

      this.metricsService.incRequests(String(method), String(path), statusCode);
      this.metricsService.observeDuration(String(method), String(path), statusCode, duration);
      this.metricsService.decActiveRequests();
    });

    next();
  }
}
