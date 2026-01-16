import { Request, Response, NextFunction } from 'express';

import { Injectable } from '@common/decorators/injectable.decorator';
import { UnauthorizedException } from '@common/exceptions/http-exceptions';
import { CanActivate } from '@common/interfaces/guard.interface';
import { ConfigService } from '@core/config/config.service';

@Injectable()
export class HeaderAuthGuard implements CanActivate {
  constructor (private readonly configService: ConfigService) {}

  canActivate (req: Request, _res: Response, next: NextFunction): void {
    const healthKey = req.headers['x-health-key'];
    const secretKey = this.configService.get<string>('HEALTH_CHECK_SECRET');

    if (!secretKey) return next();
    if (healthKey !== secretKey) throw new UnauthorizedException('Invalid health check key');

    next();
  }
}
