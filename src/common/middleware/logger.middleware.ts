import { Request, Response, NextFunction } from 'express';

import { Injectable } from '@common/decorators/injectable.decorator';
import { NestMiddleware } from '@common/interfaces/middleware.interface';
import { Logger } from '@common/logger/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger(LoggerMiddleware.name);

  use (req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    res.on('close', () => this.logger.log(`${method} ${originalUrl} ${res.statusCode}`));
    next();
  }
}
