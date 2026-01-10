import { Request, Response, NextFunction } from 'express';

import { Injectable } from '@common/decorators';
import { NestMiddleware } from '@common/interfaces';
import { Logger } from '@common/logger';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use (req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const userAgent = req.get('User-Agent') || '';

    res.on('close', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');

      this.logger.log(`${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent}`);
    });

    next();
  }
}
