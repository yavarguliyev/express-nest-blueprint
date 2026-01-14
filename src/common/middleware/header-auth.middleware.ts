import { Request, Response, NextFunction } from 'express';

import { Injectable } from '@common/decorators';
import { NestMiddleware } from '@common/interfaces';
import { ConfigService } from '@core/config/config.service';

@Injectable()
export class HeaderAuthMiddleware implements NestMiddleware {
  constructor (private readonly configService: ConfigService) {}

  use (req: Request, res: Response, next: NextFunction): void {
    const { path } = req;
    const isObservabilityPath = path.startsWith('/health') || path.startsWith('/metrics');

    if (!isObservabilityPath) return next();

    const healthKey = req.headers['x-health-key'];
    const secretKey = this.configService.get<string>('HEALTH_CHECK_SECRET');

    if (!secretKey) return next();

    if (healthKey !== secretKey) {
      res.status(401).json({
        success: false,
        error: {
          statusCode: 401,
          message: 'Unauthorized access',
          reason: 'Invalid or missing x-health-key header'
        }
      });

      return;
    }

    next();
  }
}
