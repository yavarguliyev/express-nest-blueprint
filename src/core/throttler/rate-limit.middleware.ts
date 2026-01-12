import { Request, Response, NextFunction } from 'express';

import { Injectable } from '@common/decorators';
import { NestMiddleware } from '@common/interfaces';
import { getErrorMessage } from '@common/helpers';
import { Logger } from '@common/logger';
import { ThrottlerService } from '@core/throttler/throttler.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RateLimitMiddleware');
  private readonly limit = 50;
  private readonly ttl = 60;

  constructor (private readonly throttlerService: ThrottlerService) {}

  use (req: Request, res: Response, next: NextFunction): void {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    
    this.throttlerService.checkRateLimit(String(key), this.limit, this.ttl)
      .then((result) => {
        res.setHeader('X-RateLimit-Limit', this.limit);
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
      .catch((error) => {
        this.logger.error(`Rate Limit Error: ${getErrorMessage(error)}`);
        next();
      });
  }
}
