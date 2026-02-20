import { Server } from 'http';

import { MiddlewareConsumer } from './middleware.interface';
import { ParamSource } from '../../types/nest/nest-core.type';
import { AppName } from '../../../domain/enums/common/common.enum';
import { Constructor, DynamicModule, ExpressHttpMethod } from 'exports/domain.exports';
import { Request, Response, NextFunction } from 'express';
import { NestApplication } from 'application/nest-application';
import { Container } from 'exports/core.exports';

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
export interface ServerRetryContext {
  err: unknown;
  server: Server;
  retries: number;
  maxRetries: number;
  _port: number;
  _host?: string;
  resolve: (server: Server) => void;
  reject: (err: Error) => void;
  retryFn: () => Promise<Server>;
}
export interface ControllerInvocationContext<T = unknown> {
  req: Request;
  res: Response;
  controllerClass: Constructor<T>;
  methodName: string;
  method: (...args: unknown[]) => Promise<unknown>;
}

export interface ControllerExecutionContext<T = unknown> {
  req: Request;
  res: Response;
  next: NextFunction;
  controllerClass: Constructor<T>;
  methodName: string;
  paramMetadata: ParamMetadata[];
}
export interface ControllerDefinitionContext<T = unknown> {
  controllerClass: Constructor<T>;
  instance: T;
  methodName: string;
  basePath: string;
  methodMap: Record<string, ExpressHttpMethod>;
}

export interface BaseModuleContext {
  imports: Array<Constructor | DynamicModule | Promise<DynamicModule>> | undefined;
  container: Container;
}

export interface ModuleBootstrapContext extends BaseModuleContext {
  app: NestApplication;
}
