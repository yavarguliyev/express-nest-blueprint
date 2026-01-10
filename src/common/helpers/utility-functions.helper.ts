import { Express, RequestHandler } from 'express';
import { ChildProcess, fork } from 'child_process';

import { AppRoles, RequestMethod } from '@common/enums';
import { HandleProcessSignalsOptions, NestMiddleware } from '@common/interfaces';
import { Logger } from '@common/logger';
import { MiddlewareNewConstructor } from '@common/types';

export const createMethodMap = (app: Express) => {
  return {
    [RequestMethod.GET]: app.get.bind(app),
    [RequestMethod.POST]: app.post.bind(app),
    [RequestMethod.PUT]: app.put.bind(app),
    [RequestMethod.DELETE]: app.delete.bind(app),
    [RequestMethod.PATCH]: app.patch.bind(app),
    [RequestMethod.ALL]: app.use.bind(app),
  } as Record<RequestMethod, (path: string, handler: RequestHandler) => void>;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);

  return 'Unknown error occurred';
};

export const handleProcessSignals = <Args extends unknown[]>({ shutdownCallback, callbackArgs }: HandleProcessSignalsOptions<Args>): void => {
  ['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach((signal) =>
    process.on(signal, () => {
      shutdownCallback(...callbackArgs).catch(() => {
        process.exit(1);
      });
    })
  );
};

export const isNestMiddleware = (value: unknown): value is NestMiddleware => {
  return typeof value === 'object' && value !== null && 'use' in value && typeof (value as { use: unknown }).use === 'function';
};

export const isMiddlewareConstructor = (value: unknown): value is MiddlewareNewConstructor => {
  if (typeof value !== 'function' || !value.prototype) {
    return false;
  }

  return isNestMiddleware(value.prototype as Partial<NestMiddleware>);
};

export const spawnWorker = (modulePath: string): ChildProcess | undefined => {
  const role = process.env['APP_ROLE'] as AppRoles;

  if (!role || role === AppRoles.API) {
    const workerProcess = fork(modulePath, [], { env: { ...process.env, APP_ROLE: AppRoles.WORKER }, execArgv: process.execArgv });

    workerProcess.on('error', (err) => Logger.error(`Worker process error: ${getErrorMessage(err)}`, 'Bootstrap'));
    workerProcess.on('exit', (code) => Logger.warn(`Worker process exited with code ${code}`, 'Bootstrap'));

    return workerProcess;
  }

  return undefined;
};
