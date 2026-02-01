import { Request, Response, NextFunction } from 'express';

import { Injectable } from '../decorators/injectable.decorator';
import { getErrorMessage } from '../../domain/helpers/utility-functions.helper';
import { NestMiddleware } from '../../domain/interfaces/nest/middleware.interface';
import { ThrottlerService } from '../../infrastructure/throttler/throttler.service';
import { Logger } from '../../infrastructure/logger/logger.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly limit = 50;
  private readonly ttl = 60;

  constructor(private readonly throttlerService: ThrottlerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const key = String(req.headers['x-forwarded-for'] || req.ip || 'unknown');
    const path = (req.originalUrl || req.path || '').toLowerCase();

    if (path.includes('health')) {
      return next();
    }

    const isAdminPath = path.includes('admin');
    const currentLimit = isAdminPath ? 5000 : this.limit;

    this.throttlerService
      .checkRateLimit(String(key), currentLimit, this.ttl)
      .then(result => {
        res.setHeader('X-RateLimit-Limit', currentLimit);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', result.reset);

        if (result.isBlocked) {
          res.status(429).json({
            statusCode: 429,
            message: 'Too Many Requests',
            error: 'Rate limit exceeded',
            retryAfter: result.reset
          });

          return;
        }

        next();
      })
      .catch(error => {
        void this.logger.error(`Rate Limit Error: ${getErrorMessage(error)}`);
        next();
      });
  }
}
