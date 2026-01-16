import { Job } from 'bullmq';
import { ClassConstructor } from 'class-transformer';
import { Request, Response, NextFunction, RequestHandler, Application } from 'express';

import { INITIALIZER_TOKENS, METHODS } from '@common/constants/system.const';
import type { Container } from '@common/container/container';
import { DataProcessingJobData, ReportJobData } from '@common/interfaces/bullmq.interface';
import { ParamMetadata, SupportsCreate, SupportsDelete, SupportsFindAll, SupportsFindById, SupportsFindWithPagination, SupportsUpdate } from '@common/interfaces/common.interface';
import { DatabaseAdapter, DatabaseConfig } from '@common/interfaces/database.interface';
import { NestMiddleware } from '@common/interfaces/middleware.interface';

export type AdapterConstructor = new (config: DatabaseConfig) => DatabaseAdapter;

export type ClassProvider<T = object> = { type: 'class'; target: Constructor<T> };

export type Constructor<T = object, Args extends unknown[] = never[]> = new (...args: Args) => T;

export type AbstractConstructor<T = object, Args extends unknown[] = never[]> = abstract new (...args: Args) => T;

export type DataProcessingOperation = 'analyze' | 'export' | 'transform';

export type ExceptionClass<T extends Error = Error, Args extends unknown[] = never[]> = new (...args: Args) => T;

export type FactoryProvider<T = object> = {
  type: 'factory';
  factory: (...args: unknown[]) => T;
  inject: (Constructor | string | symbol)[];
};

export type HttpMethod = (typeof METHODS)[number];

export type ExpressHttpMethod = (path: string, ...handlers: RequestHandler[]) => Application;

export type ExpressHttpMethods = {
  [K in HttpMethod]: ExpressHttpMethod;
};

export type InitializerToken = (typeof INITIALIZER_TOKENS)[number];

export type InjectionToken<T = unknown> = Constructor<T> | AbstractConstructor<T> | string | symbol;

export type JobBackoffType = 'exponential' | 'fixed';

export type JobData = Job<JobPayload>;

export type JobPayload = DataProcessingJobData | ReportJobData;

export type JwtRegisteredClaim = 'iat' | 'exp';

export type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

export type MiddlewareNewConstructor = new () => NestMiddleware;

export type ObjectProvider<T = unknown> = {
  inject?: Array<InitializerToken | symbol | Constructor<unknown>>;
  provide: InitializerToken | symbol | Constructor<T> | AbstractConstructor<T>;
  useClass?: Constructor<T>;
  useFactory?: (...args: unknown[]) => T;
  useValue?: T;
};

export type ParamHandler = (param: ParamMetadata, index: number, args: unknown[], paramTypes: ClassConstructor<object>[], req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export type ParserType = 'boolean' | 'number' | 'string';

export type ParserFn = (v: string, def?: unknown) => unknown;

export type PatchedMethod = {
  (...args: unknown[]): Promise<unknown>;
  __original__?: (...args: unknown[]) => Promise<unknown>;
};

export type Provider<T = object> = ClassProvider<T> | FactoryProvider<T> | ValueProvider<T>;

export type ProviderOptions<T = unknown> = Constructor<T> | ObjectProvider<T>;

export type ProviderResolver = (entry: Provider, container: Container) => unknown;

export type ProviderType = 'value' | 'factory' | 'class';

export type Providers = Array<ProviderOptions>;

export type ReportType = 'analytics' | 'financial' | 'sales';

export type SortBy = 'id' | 'firstName' | 'lastName' | 'email' | 'createdAt';

export type SortOrder = 'ASC' | 'DESC';

export type TimeUnit = 's' | 'm' | 'h' | 'd';

export type ValueProvider<T = object> = { type: 'value'; value: T };

export type WhereConditions = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'ILIKE' | 'IN' | 'NOT IN';

export type CrudRepository = Partial<SupportsFindWithPagination & SupportsFindAll & SupportsFindById & SupportsCreate & SupportsUpdate & SupportsDelete>;
