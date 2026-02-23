import { Express, Request, Response, Application } from 'express';
import { PathParams, RequestHandlerParams } from 'express-serve-static-core';
import { Server } from 'http';

import { MiddlewareSetup } from './middleware-setup';
import { GlobalExceptionFilter } from '../../core/filters/global-exception.filter';
import { ExpressHttpMethods, ExpressHttpMethod } from '../../domain/types/api/api-http.type';
import { METHODS } from '../../domain/constants/api/api.const';
import { getErrorMessage } from '../../domain/helpers/utility-functions.helper';
import { InternalServerErrorException } from '../../domain/exceptions/http-exceptions';
import { ServerRetryContext } from '../../domain/interfaces/nest/nest-core.interface';

export class LifecycleHooks {
  private server?: Server;
  private middlewareSetup: MiddlewareSetup;

  constructor() {
    this.middlewareSetup = new MiddlewareSetup();
  }

  setupGlobalErrorHandler(app: Express): void {
    app.use(GlobalExceptionFilter.create());
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          statusCode: 404,
          reason: 'Route not found',
          errors: [{ message: `Route ${req.method} ${req.path} not found`, reason: 'Route not found' }]
        },
        timestamp: new Date().toISOString(),
        path: req.url
      });
    });
  }

  setupPathValidation(app: Express): void {
    const expressApp = app as unknown as Application & ExpressHttpMethods;

    METHODS.forEach(method => {
      const original = (expressApp[method] as (...args: unknown[]) => unknown).bind(expressApp);
      if (original) {
        const target = expressApp as unknown as Record<string, ExpressHttpMethod>;
        target[method] = this.createValidatedMethod(original, expressApp);
      }
    });
  }

  async listen(app: Express, port: number, host?: string): Promise<Server> {
    this.setupGlobalErrorHandler(app);
    return this.attemptListenWithRetries(app, port, host);
  }

  async close(): Promise<void> {
    if (this.server?.listening) await new Promise<void>((resolve, reject) => this.server!.close(error => (error ? reject(error) : resolve())));
  }

  private createValidatedMethod(original: (...args: unknown[]) => unknown, app: Application): ExpressHttpMethod {
    return (path: PathParams, ...handlers: RequestHandlerParams[]) => {
      if (typeof path === 'string' && this.middlewareSetup.hasInvalidPathSyntax(path)) return app;

      try {
        return original(path, ...handlers) as Application;
      } catch (error) {
        if (error instanceof Error && error.message.includes('Missing parameter name')) return app;
        throw error;
      }
    };
  }

  private async attemptListenWithRetries(app: Express, port: number, host?: string, maxRetries = 30): Promise<Server> {
    let retries = 0;

    const attempt = (): Promise<Server> => {
      return new Promise((resolve, reject) => {
        const server = app.listen(port, host as string, () => {
          this.server = server;
          resolve(server);
        });

        server.once('error', (err: unknown) =>
          this.handleListenError({ err, server, retries: retries++, maxRetries, _port: port, _host: host ?? '', resolve, reject, retryFn: attempt })
        );
      });
    };

    return attempt();
  }

  private handleListenError(opts: ServerRetryContext): void {
    const { err, server, retries, maxRetries, retryFn, resolve, reject } = opts;

    void (async (): Promise<void> => {
      const error = err as Error & { code?: string };

      if (error.code === 'EADDRINUSE' && retries < maxRetries) {
        await new Promise<void>(closeResolve => server.close(() => closeResolve()));
        setTimeout(() => void retryFn().then(resolve).catch(reject), 500);
      } else reject(new InternalServerErrorException(getErrorMessage(error)));
    })();
  }
}
