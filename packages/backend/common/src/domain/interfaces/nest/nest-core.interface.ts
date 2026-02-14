import { MiddlewareConsumer } from './middleware.interface';
import { ParamSource } from '../../types/nest/nest-core.type';
import { AppName } from '../../../domain/enums/common/common.enum';

export interface ArgumentsHost {
  getArgByIndex<T = unknown>(index: number): T;
  getArgs<T extends Array<unknown> = unknown[]>(): T;
  getType<TContext extends string = string>(): TContext;
  switchToHttp(): HttpArgumentsHost;
  switchToRpc(): RpcArgumentsHost;
  switchToWs(): WsArgumentsHost;
}

export interface HttpArgumentsHost {
  getNext<T = unknown>(): T;
  getRequest<T = unknown>(): T;
  getResponse<T = unknown>(): T;
}

export interface RpcArgumentsHost {
  getContext<T = unknown>(): T;
  getData<T = unknown>(): T;
}

export interface WsArgumentsHost {
  getClient<T = unknown>(): T;
  getData<T = unknown>(): T;
}

export interface ExceptionFilter<T = unknown> {
  catch(exception: T, host: ArgumentsHost): unknown;
}

export interface HttpExceptionOptions {
  cause?: Error;
  description?: string;
}

export interface ExtractedDescriptionAndOptions {
  description?: string;
  httpExceptionOptions?: HttpExceptionOptions;
}

export interface HasGetStatus {
  getStatus(): number;
}

export interface HasGetResponse {
  getResponse(): string | object;
}

export interface NestModule {
  configure(consumer: MiddlewareConsumer): void;
}

export interface ParamMetadata {
  data?: unknown;
  index: number;
  type: ParamSource;
}

export interface RouteMetadata {
  method: string;
  path: string;
}

export interface BootstrapOptions {
  appName?: AppName;
  portEnvVar?: string;
  hostEnvVar?: string;
  defaultPort?: number;
  defaultHost?: string;
  rootDir?: string;
}
