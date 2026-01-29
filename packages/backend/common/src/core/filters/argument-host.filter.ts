import { Request, Response, NextFunction } from 'express';

import { BadRequestException } from '../../domain/exceptions/http-exceptions';
import { ArgumentsHost, HttpArgumentsHost, RpcArgumentsHost, WsArgumentsHost } from '../../domain/interfaces/nest/nest-core.interface';

export class ArgumentsHostFilter implements ArgumentsHost {
  constructor (
    private readonly request: Request,
    private readonly response: Response,
    private readonly next: NextFunction
  ) {}

  switchToHttp (): HttpArgumentsHost {
    return {
      getRequest: <T = unknown>() => this.request as T,
      getResponse: <T = unknown>() => this.response as T,
      getNext: <T = unknown>() => this.next as T
    };
  }

  getArgs<T extends Array<unknown> = unknown[]> (): T {
    return [this.request, this.response, this.next] as T;
  }

  getArgByIndex<T = unknown> (index: number): T {
    return [this.request, this.response, this.next][index] as T;
  }

  switchToRpc (): RpcArgumentsHost {
    throw new BadRequestException('RPC context not supported');
  }

  switchToWs (): WsArgumentsHost {
    throw new BadRequestException('WebSocket context not supported');
  }

  getType<TContext extends string = string> (): TContext {
    return 'http' as TContext;
  }
}
