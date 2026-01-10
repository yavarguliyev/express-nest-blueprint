import { Job } from 'bullmq';
import { ClassConstructor } from 'class-transformer';
import { Request, NextFunction } from 'express';

import { METHODS } from '@common/constants/common.const';
import { DatabaseAdapter, DatabaseConfig, DataProcessingJobData, NestMiddleware, ParamMetadata, ReportJobData } from '@common/interfaces';

export type AdapterConstructor = new (config: DatabaseConfig) => DatabaseAdapter;

export type ClassProvider<T = object> = { type: 'class'; target: Constructor<T> };

export type Constructor<T = object, Args extends unknown[] = never[]> = new (...args: Args) => T;

export type DataProcessingOperation = 'analyze' | 'export' | 'transform';

export type ExceptionClass<T extends Error = Error, Args extends unknown[] = never[]> = new (...args: Args) => T;

export type FactoryProvider<T = object> = {
  type: 'factory';
  factory: (...args: unknown[]) => T;
  inject: (Constructor | string | symbol)[];
};

export type HttpMethod = typeof METHODS[number];

export type InitializerToken = 'APP_INITIALIZER' | 'COMPUTE_INITIALIZER' | 'COMPUTE_MODULE_OPTIONS' | 'DATABASE_INITIALIZER' | 'LIFECYCLE_INITIALIZER' | 'LOGGER_INITIALIZER';

export type InjectionToken<T = unknown> = Constructor<T> | string | symbol;

export type JobBackoffType = 'exponential' | 'fixed';

export type JobData = Job<JobPayload>;

export type JobPayload = DataProcessingJobData | ReportJobData;

export type JwtRegisteredClaim = 'iat' | 'exp';

export type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

export type MiddlewareNewConstructor = new () => NestMiddleware;

export type ObjectProvider<T = unknown> = {
  inject?: Array<InitializerToken | symbol | Constructor<unknown>>;
  provide: InitializerToken | symbol | Constructor<T>;
  useClass?: Constructor<T>;
  useFactory?: (...args: unknown[]) => T;
  useValue?: T;
};

export type ParamHandler = (param: ParamMetadata, index: number, args: unknown[], paramTypes: ClassConstructor<object>[], req: Request) => void | Promise<void>;

export type ParserType = 'boolean' | 'number' | 'string';

export type ParserFn = (v: string, def?: unknown) => unknown;

export type PatchedMethod = {
  (...args: unknown[]): Promise<unknown>;
  __original__?: (...args: unknown[]) => Promise<unknown>;
};

export type Provider<T = object> = ClassProvider<T> | FactoryProvider<T> | ValueProvider<T>;

export type ProviderOptions<T = unknown> = Constructor<T> | ObjectProvider<T>;

export type Providers = Array<ProviderOptions>;

export type ReportType = 'analytics' | 'financial' | 'sales';

export type SortBy = 'id' | 'firstName' | 'lastName' | 'email' | 'createdAt';

export type SortOrder = 'ASC' | 'DESC';

export type TimeUnit = 's' | 'm' | 'h' | 'd';

export type ValueProvider<T = object> = { type: 'value'; value: T };

export type WhereConditions = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'ILIKE' | 'IN' | 'NOT IN';
