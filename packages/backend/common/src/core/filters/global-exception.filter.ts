import { Request, Response, NextFunction } from 'express';

import { ArgumentsHostFilter } from './argument-host.filter';
import { HttpException } from '../../domain/exceptions/http-exception';
import { hasGetStatus, hasGetResponse } from '../../domain/helpers/utility-functions.helper';
import { ExceptionFilter, ArgumentsHost } from '../../domain/interfaces/common.interface';
import { ConfigService } from '../../infrastructure/config/config.service';
import { Logger } from '../../infrastructure/logger/logger.service';

export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly configService: ConfigService | undefined;

  constructor (configService?: ConfigService) {
    this.configService = configService;
  }

  catch (exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getHttpStatus(exception);
    const message = this.getErrorMessage(exception);
    const errorResponse = this.getErrorResponse(exception, status, message, request);

    if (status >= 500) {
      void this.logger.error(`${request.method} ${request.url} - Internal Server Error`, exception instanceof Error ? exception.stack : undefined);
    } else {
      void this.logger.warn(`${request.method} ${request.url} - ${status} ${JSON.stringify(errorResponse)}`);
    }

    if (!response.headersSent) {
      response.status(status).json(errorResponse);
    }
  }

  static create (configService?: ConfigService): (error: unknown, req: Request, res: Response, next: NextFunction) => void {
    const filter = new GlobalExceptionFilter(configService);
    return (error: unknown, req: Request, res: Response, next: NextFunction) => {
      filter.catch(error, new ArgumentsHostFilter(req, res, next));
    };
  }

  private getHttpStatus (exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    if (hasGetStatus(exception)) return exception.getStatus();
    return 500;
  }

  private getErrorMessage (exception: unknown): string | object {
    if (exception instanceof HttpException) return exception.getResponse();
    if (hasGetResponse(exception)) return exception.getResponse();

    if (exception instanceof Error) {
      const isProduction = this.configService ? this.configService.get('NODE_ENV') === 'production' : process.env['NODE_ENV'] === 'production';

      return isProduction ? 'Internal Server Error' : exception.message;
    }

    return 'Internal Server Error';
  }

  private getErrorResponse (exception: unknown, status: number, message: string | object, request: Request): object {
    const timestamp = new Date().toISOString();
    const path = request.url;
    let responseObj: unknown = null;

    if (exception instanceof HttpException) {
      responseObj = exception.getResponse();
    } else if (hasGetResponse(exception)) {
      responseObj = exception.getResponse();
    }

    if (responseObj && typeof responseObj === 'object') {
      return { ...responseObj, timestamp, path };
    }

    if (responseObj) {
      return { statusCode: status, message: responseObj, timestamp, path };
    }

    const msg = typeof message === 'string' ? message : 'Internal Server Error';

    return {
      statusCode: status,
      message: msg,
      error: this.getErrorName(exception),
      timestamp,
      path
    };
  }

  private getErrorName (exception: unknown): string {
    if (exception instanceof Error) return exception.constructor.name;
    return 'InternalServerErrorException';
  }
}
