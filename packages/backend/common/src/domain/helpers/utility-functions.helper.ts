import { ChildProcess, fork } from 'child_process';
import { Express, RequestHandler } from 'express';

import { RequestMethod } from '../enums/api/api.enum';
import { AppRoles } from '../enums/auth/auth.enum';
import { HandleProcessSignalsOptions } from '../interfaces/common/util.interface';
import { HasGetResponse, HasGetStatus } from '../interfaces/nest/nest-core.interface';
import { NestMiddleware } from '../interfaces/nest/middleware.interface';
import { MiddlewareNewConstructor } from '../types/nest/nest-core.type';
import { HealthStatus, OverallStatus } from '../../domain/types/common/status.type';
import { Logger } from '../../infrastructure/logger/logger.service';

export const createMethodMap = (app: Express): Record<RequestMethod, (path: string, handler: RequestHandler) => void> => {
  return {
    [RequestMethod.GET]: app.get.bind(app),
    [RequestMethod.POST]: app.post.bind(app),
    [RequestMethod.PUT]: app.put.bind(app),
    [RequestMethod.DELETE]: app.delete.bind(app),
    [RequestMethod.PATCH]: app.patch.bind(app),
    [RequestMethod.ALL]: app.use.bind(app)
  };
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);

  return 'Unknown error occurred';
};

export const handleProcessSignals = <Args extends unknown[]>({
  shutdownCallback,
  callbackArgs,
  role
}: HandleProcessSignalsOptions<Args> & { role?: AppRoles }): void => {
  const isWorker = role === AppRoles.WORKER;
  const signals = isWorker ? ['SIGINT', 'SIGTERM'] : ['SIGINT', 'SIGTERM', 'SIGUSR2'];

  signals.forEach(signal =>
    process.once(signal, () => {
      Logger.log(`Received signal ${signal} (Role: ${role || 'api'})`, 'System');
      void shutdownCallback(...callbackArgs).catch(() => {
        process.exit(1);
      });
    })
  );
};

export const isNestMiddleware = (value: unknown): value is NestMiddleware => {
  return typeof value === 'object' && value !== null && 'use' in value && typeof (value as { use: unknown }).use === 'function';
};

export const isMiddlewareConstructor = (value: unknown): value is MiddlewareNewConstructor => {
  if (typeof value !== 'function' || !value.prototype) return false;
  return isNestMiddleware(value.prototype as Partial<NestMiddleware>);
};

export const spawnWorker = (modulePath: string, role?: AppRoles, baseEnv?: NodeJS.ProcessEnv): ChildProcess | undefined => {
  if (!role || role === AppRoles.API) {
    const execArgv = process.execArgv.filter(arg => !arg.includes('--inspect') && !arg.includes('--debug'));
    const env: NodeJS.ProcessEnv = { ...(baseEnv ?? process.env), APP_ROLE: AppRoles.WORKER };
    delete env['NODE_OPTIONS'];
    const workerProcess = fork(modulePath, [], { env, execArgv });

    workerProcess.on('error', err => Logger.error(`Worker process error: ${getErrorMessage(err)}`, 'Bootstrap'));
    workerProcess.on('exit', code => Logger.warn(`Worker process exited with code ${code}`, 'Bootstrap'));

    return workerProcess;
  }

  return undefined;
};

export const hasGetStatus = (exception: unknown): exception is HasGetStatus => {
  return (
    typeof exception === 'object' && exception !== null && 'getStatus' in exception && typeof (exception as HasGetStatus).getStatus === 'function'
  );
};

export const hasGetResponse = (exception: unknown): exception is HasGetResponse => {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    'getResponse' in exception &&
    typeof (exception as HasGetResponse).getResponse === 'function'
  );
};

export const convertValueToSearchableString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(item => convertValueToSearchableString(item)).join(' ');

  if (typeof value === 'object' && value !== null) {
    if (value.toString !== Object.prototype.toString) return (value as { toString(): string }).toString();
    const obj = value as Record<string, unknown>;
    const searchableProps = ['name', 'title', 'label', 'value', 'text', 'description'];
    for (const prop of searchableProps) if (prop in obj && typeof obj[prop] === 'string') return obj[prop];
    return '';
  }

  return '';
};

export const parseId = (id: string | number): string | number => {
  if (typeof id === 'number') return id;

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(id)) return id;

  const parsed = parseInt(id, 10);
  if (!isNaN(parsed)) return parsed;

  return id;
};

export const hasProfileImageUrl = (item: unknown): item is { profileImageUrl?: string } => {
  return typeof item === 'object' && item !== null && 'profileImageUrl' in item;
};

export const bytesToMB = (bytes: number): number => Math.round((bytes / 1024 / 1024) * 100) / 100;

export const nowISO = (): string => new Date().toISOString();

export const mapOverall = (status: HealthStatus): OverallStatus => (status === 'degraded' ? 'down' : status);
