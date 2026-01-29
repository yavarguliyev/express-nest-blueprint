import { Request, Response, NextFunction } from 'express';

import { Injectable } from '../decorators/injectable.decorator';
import { NestMiddleware } from '../../domain/interfaces/nest/middleware.interface';
import { Logger } from '../../infrastructure/logger/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger(LoggerMiddleware.name);

  use (req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    res.on('close', () => {
      void this.logger.log(`${method} ${originalUrl} ${res.statusCode}`);
    });
    next();
  }
}
