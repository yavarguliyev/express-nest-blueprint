import { Request, Response, NextFunction } from 'express';

import { HttpException } from '@common/exceptions';
import { ArgumentsHostFilter } from '@common/filters';
import { ArgumentsHost, ExceptionFilter } from '@common/interfaces';

interface HasGetStatus {
  getStatus (): number;
}

interface HasGetResponse {
  getResponse (): string | object;
}

function hasGetStatus (exception: unknown): exception is HasGetStatus {
  return typeof exception === 'object' && exception !== null && 'getStatus' in exception && typeof (exception as HasGetStatus).getStatus === 'function';
}

function hasGetResponse (exception: unknown): exception is HasGetResponse {
  return typeof exception === 'object' && exception !== null && 'getResponse' in exception && typeof (exception as HasGetResponse).getResponse === 'function';
}

export class GlobalExceptionFilter implements ExceptionFilter {
  catch (exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getHttpStatus(exception);
    const message = this.getErrorMessage(exception);
    const errorResponse = this.getErrorResponse(exception, status, message, request);

    if (!response.headersSent) {
      response.status(status).json(errorResponse);
    }
  }

  static create (): (error: unknown, req: Request, res: Response, next: NextFunction) => void {
    const filter = new GlobalExceptionFilter();
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
    if (exception instanceof Error) return process.env.NODE_ENV === 'production' ? 'Internal Server Error' : exception.message;
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
      return { ...(responseObj), timestamp, path };
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
