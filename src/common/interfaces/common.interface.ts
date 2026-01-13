import { LogLevel } from '@common/enums';
import { MiddlewareConsumer } from '@common/interfaces';
import { Constructor, AbstractConstructor, InitializerToken, Providers } from '@common/types';

export interface ApiControllerOptions {
  path: string;
  prefix?: string;
  version?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string | undefined;
  message?: string | undefined;
  success: boolean;
}

export interface ApiVersionConfig {
  prefix?: string;
  version: string;
}

export interface ArgumentsHost {
  getArgByIndex<T = unknown>(index: number): T;
  getArgs<T extends Array<unknown> = unknown[]>(): T;
  getType<TContext extends string = string>(): TContext;
  switchToHttp(): HttpArgumentsHost;
  switchToRpc(): RpcArgumentsHost;
  switchToWs(): WsArgumentsHost;
}

export interface BaseControllerOptions {
  path: string;
  prefix?: string;
  version?: string;
}

export interface CacheOptions {
  ttl?: number;
  key?: string;
}

export interface ComputeOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  background?: boolean;
  timeout?: number;
}

export interface ConfigModuleOptions {
  envFilePath?: string;
  ignoreEnvFile?: boolean;
  isGlobal?: boolean;
}

export interface ControllerOptions {
  path?: string;
}

export interface CorsOptions {
  allowedHeaders?: string;
  methods?: string;
  origin?: string;
}

export interface DynamicModule {
  controllers?: Constructor[];
  exports?: Array<Constructor | AbstractConstructor | InitializerToken | symbol | DynamicModule | Promise<DynamicModule>>;
  global?: boolean;
  imports?: Array<Constructor | DynamicModule | Promise<DynamicModule>>;
  module: Constructor;
  providers?: Providers;
}

export interface ExceptionFilter<T = unknown> {
  catch(exception: T, host: ArgumentsHost): unknown;
}

export interface ExtractedDescriptionAndOptions {
  description?: string;
  httpExceptionOptions?: HttpExceptionOptions;
}

export interface ExtractMethodOptions<T extends object, K extends keyof T> {
  instance: T;
  methodName: K;
}

export interface HandleProcessSignalsOptions<Args extends unknown[]> {
  callbackArgs: Args;
  shutdownCallback: (...args: Args) => Promise<void>;
}

export interface HasMethodOptions<T extends object> {
  instance: T;
  methodName: string;
}

export interface HttpArgumentsHost {
  getNext<T = unknown>(): T;
  getRequest<T = unknown>(): T;
  getResponse<T = unknown>(): T;
}

export interface HttpExceptionOptions {
  cause?: Error;
  description?: string;
}

export interface GracefulShutDownServiceConfig {
  name: string;
  disconnect: () => Promise<void>;
}

export interface JwtPayload {
  email: string;
  exp?: number;
  iat?: number;
  role: string;
  sub: number;
}

export interface LoggerModuleOptions {
  config?: LoggerOptions;
}

export interface LoggerOptions {
  context?: string;
  timestamp?: boolean;
  logLevel?: LogLevel;
}

export interface ModuleMetadata {
  controllers?: Constructor[];
  exports?: Array<Constructor | AbstractConstructor | string | symbol | DynamicModule | Promise<DynamicModule>>;
  global?: boolean;
  imports?: Array<Constructor | DynamicModule | Promise<DynamicModule>>;
  providers?: Providers;
}

export interface NestModule {
  configure(consumer: MiddlewareConsumer): void;
}

export interface ParamMetadata {
  data?: unknown;
  index: number;
  type: 'body' | 'headers' | 'param' | 'query' | 'request' | 'response';
}

export interface RegisterModuleOptions {
  moduleOrConfig: Constructor | DynamicModule;
}

export interface RegisterOptions<T = object> {
  inject?: (Constructor | string | symbol)[];
  provide: Constructor<T> | string | symbol;
  useClass?: Constructor<T>;
  useFactory?: (...args: unknown[]) => T;
  useValue?: T;
}

export interface RetryOptions {
  maxRetries: number;
  onFailure?: (error: Error, attempt: number) => void;
  onRetry?: (attempt: number) => void;
  retryDelay: number;
  serviceName: string;
}

export interface RouteMetadata {
  method: string;
  path: string;
}

export interface RpcArgumentsHost {
  getContext<T = unknown>(): T;
  getData<T = unknown>(): T;
}

export interface WsArgumentsHost {
  getClient<T = unknown>(): T;
  getData<T = unknown>(): T;
}

export interface HasGetStatus {
  getStatus (): number;
}

export interface HasGetResponse {
  getResponse (): string | object;
}
