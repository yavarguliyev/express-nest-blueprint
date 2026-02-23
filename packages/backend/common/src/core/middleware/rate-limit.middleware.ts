import { Request, Response, NextFunction } from 'express';

import { Injectable } from '../decorators/injectable.decorator';
import { EXCLUDED_PATHS } from '../../domain/constants/nest/middleware.const';
import { NestMiddleware } from '../../domain/interfaces/nest/middleware.interface';
import { getErrorMessage } from '../../domain/helpers/utility-functions.helper';
import { ConfigService } from '../../infrastructure/config/config.service';
import { Logger } from '../../infrastructure/logger/logger.service';
import { ThrottlerService } from '../../infrastructure/throttler/throttler.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly ttl: number;
  private readonly defaultLimit: number;
  private readonly adminLimit: number;
  private readonly errorMessage: string;
  private readonly errorTitle: string;

  constructor (
    private readonly throttlerService: ThrottlerService,
    private readonly configService: ConfigService
  ) {
    this.adminLimit = 5000;
    this.ttl = this.configService.get<number>('RATE_LIMIT_WINDOW_MS')! / 1000;
    this.defaultLimit = this.configService.get<number>('RATE_LIMIT_MAX_REQUESTS')!;
    this.errorMessage = this.configService.get<string>('RATE_LIMIT_ERROR_MESSAGE')!;
    this.errorTitle = this.configService.get<string>('RATE_LIMIT_ERROR_TITLE')!;
  }

  use (req: Request, res: Response, next: NextFunction): void {
    const path = (req.originalUrl || req.path || '').toLowerCase();

    if (EXCLUDED_PATHS.some(excluded => path.includes(excluded))) return next();

    const key = String(req.headers['x-forwarded-for'] || req.ip || 'unknown');
    const isAdminPath = path.includes('/admin');
    const currentLimit = isAdminPath ? this.adminLimit : this.defaultLimit;

    this.throttlerService
      .checkRateLimit({ key: String(key), limit: currentLimit, ttl: this.ttl })
      .then(result => {
        res.setHeader('X-RateLimit-Limit', currentLimit);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', result.reset);

        if (result.isBlocked) {
          res.status(429).json({ statusCode: 429, message: this.errorTitle, error: this.errorMessage, retryAfter: result.reset });
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
