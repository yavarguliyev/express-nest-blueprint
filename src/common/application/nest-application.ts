import { ClassConstructor } from 'class-transformer';
import express, { Express, Request, Response, NextFunction, RequestHandler, Application } from 'express';
import { Server } from 'http';

import { METHODS, paramHandlers } from '@common/constants';
import { Container } from '@common/container';
import { CONTROLLER_METADATA, GUARDS_METADATA, PARAM_METADATA, ROUTE_METADATA } from '@common/decorators';
import { BadRequestException, InternalServerErrorException, UnauthorizedException } from '@common/exceptions';
import { GlobalExceptionFilter } from '@common/filters';
import { AuthGuard, RolesGuard } from '@common/guards';
import { CONTROLLER_REGISTRY } from '@common/helpers';
import { CanActivate, ControllerOptions, CorsOptions, ExtractMethodOptions, HasMethodOptions, ParamMetadata, RouteMetadata } from '@common/interfaces';
import { Logger } from '@common/logger';
import { Constructor, ExpressHttpMethods, HttpMethod } from '@common/types';

export class NestApplication {
  private app: Express;
  private server?: Server;
  private container: Container;
  private globalPrefix = '';

  constructor (container: Container) {
    this.app = express();
    this.container = container;
    this.setupBasicMiddleware();
    this.setupPathValidation();
  }

  public init (): void {
    this.initialize();
  }

  registerController<T extends object> (controllerClass: Constructor<T>): void {
    const controllerMetadata: ControllerOptions = Reflect.getMetadata(CONTROLLER_METADATA, controllerClass) as ControllerOptions;

    if (!controllerMetadata) throw new BadRequestException(`${controllerClass.name} is not marked as @Controller()`);

    const basePath = controllerMetadata.path || '';
    const controllerInstance = this.container.resolve({ provide: controllerClass });
    const methodNames = Object.getOwnPropertyNames(controllerClass.prototype).filter((name) => name !== 'constructor');

    const methodMap: Record<string, (path: string, handler: (req: Request, res: Response, next: NextFunction) => void) => void> = {
      get: this.app.get.bind(this.app),
      post: this.app.post.bind(this.app),
      put: this.app.put.bind(this.app),
      delete: this.app.delete.bind(this.app),
      patch: this.app.patch.bind(this.app)
    };

    methodNames.forEach((methodName) => {
      const routeMetadata = (Reflect.getMetadata(ROUTE_METADATA as symbol, controllerClass.prototype as object, methodName) || []) as RouteMetadata[];

      routeMetadata.forEach((route) => {
        const fullPath = this.normalizePath(this.globalPrefix, basePath, route.path);

        if (!this.isValidRoutePath(fullPath) || this.hasInvalidPathSyntax(fullPath)) return;
        if (!this.hasMethod({ instance: controllerInstance, methodName })) return;

        const originalMethod = this.extractMethod({ instance: controllerInstance, methodName: methodName as keyof typeof controllerInstance }) as (...args: unknown[]) => Promise<unknown>;
        const paramMetadata = (Reflect.getMetadata(PARAM_METADATA as symbol, controllerClass.prototype as object, methodName) || []) as ParamMetadata[];

        const handler = async (req: Request, res: Response, next: NextFunction) => {
          try {
            const classGuards = (Reflect.getMetadata(GUARDS_METADATA, controllerClass) || []) as Constructor<CanActivate>[];
            const methodGuards = (Reflect.getMetadata(GUARDS_METADATA, controllerClass.prototype as object, methodName) || []) as Constructor<CanActivate>[];

            const guardsToRun: Constructor<CanActivate>[] = [AuthGuard, RolesGuard, ...classGuards, ...methodGuards];

            for (const GuardClass of guardsToRun) {
              const guardInstance = this.container.resolve<CanActivate>({ provide: GuardClass });

              await new Promise<void>((resolve, reject) => {
                void guardInstance.canActivate(
                  req,
                  res,
                  (err?: Error | string) => {
                    if (err) reject(err instanceof Error ? err : new UnauthorizedException(String(err)));
                    else resolve();
                  },
                  originalMethod,
                  controllerClass
                );
              });
            }

            const args: unknown[] = [];
            const paramTypes = (Reflect.getMetadata('design:paramtypes', controllerClass.prototype as object, methodName) || []) as ClassConstructor<object>[];

            for (const param of paramMetadata.sort((a, b) => a.index - b.index)) {
              const fn = paramHandlers[param.type];
              if (fn) await fn(param, param.index, args, paramTypes, req, res, next);
            }

            const result = await originalMethod.apply(controllerInstance, args);

            if (res.headersSent) return;

            const hasPassthrough = paramMetadata.some((param) => param.type === 'response' && typeof param.data === 'object' && param.data !== null && (param.data as { passthrough?: boolean }).passthrough);

            if (hasPassthrough) {
              if (result !== undefined) res.send(result);
              return;
            }

            res.json({ success: true, data: result, message: 'Operation completed successfully' });
          } catch (err) {
            next(err);
          }
        };

        const registerFn = methodMap[route.method.toLowerCase()];
        if (registerFn) registerFn(fullPath, (...args) => void handler(...args));
      });
    });
  }

  setupGlobalErrorHandler (): void {
    this.app.use(GlobalExceptionFilter.create());
    this.app.use((req: Request, res: Response) => {
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

  getExpressApp (): Express {
    return this.app;
  }

  async listen (port: number, host?: string): Promise<Server> {
    this.setupGlobalErrorHandler();

    const maxRetries = 30;
    let retries = 0;
    const logger = new Logger('Bootstrap');

    const attemptListen = (): Promise<Server> => {
      return new Promise((resolve, reject) => {
        const server = this.app.listen(port, host as string, () => {
          this.server = server;
          resolve(server);
        });

        server.once('error', (err: unknown) => {
          void (async () => {
            const error = err as Error & { code?: string };
            if (error.code === 'EADDRINUSE' && retries < maxRetries) {
              retries++;
              logger.warn(`Port ${port} is busy, retrying (${retries}/${maxRetries}) in 500ms...`);

              await new Promise<void>((closeResolve) => {
                server.close(() => closeResolve());
              });

              setTimeout(() => {
                void attemptListen().then(resolve).catch(reject);
              }, 500);
            } else {
              const errorReason = error instanceof Error ? error : new InternalServerErrorException(String(error));
              reject(errorReason);
            }
          })();
        });
      });
    };

    return attemptListen();
  }

  get<T extends object> (provide: Constructor<T> | string | symbol): T {
    return this.container.resolve({ provide });
  }

  use(middleware: RequestHandler): this;
  use(path: string, middleware: RequestHandler): this;
  use (pathOrMiddleware: string | RequestHandler, middleware?: RequestHandler): this {
    if (typeof pathOrMiddleware === 'function') this.app.use(pathOrMiddleware);
    else if (middleware) {
      if (this.hasInvalidPathSyntax(pathOrMiddleware)) return this;
      this.app.use(pathOrMiddleware, middleware);
    }

    return this;
  }

  enableCors (options?: CorsOptions): void {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', options?.origin ?? '*');
      res.header('Access-Control-Allow-Methods', options?.methods ?? 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
      res.header('Access-Control-Allow-Headers', options?.allowedHeaders ?? 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') res.sendStatus(200);
      else next();
    });
  }

  setGlobalPrefix (prefix: string): void {
    const normalizedPrefix = prefix.trim();

    if (normalizedPrefix.includes('://')) {
      this.globalPrefix = '';
      return;
    }

    if (normalizedPrefix && !normalizedPrefix.startsWith('/')) this.globalPrefix = '/' + normalizedPrefix;
    else this.globalPrefix = normalizedPrefix;

    if (this.globalPrefix.length > 1 && this.globalPrefix.endsWith('/')) this.globalPrefix = this.globalPrefix.substring(0, this.globalPrefix.length - 1);
  }

  async close (): Promise<void> {
    if (this.server && this.server.listening) {
      return new Promise((resolve, reject) =>
        this.server!.close((error) => {
          if (error) reject(error);
          else resolve();
        })
      );
    }
  }

  private hasMethod<T extends object> ({ instance, methodName }: HasMethodOptions<T>): boolean {
    return methodName in instance && typeof Reflect.get(instance, methodName) === 'function';
  }

  private extractMethod<T extends object, K extends keyof T> ({ instance, methodName }: ExtractMethodOptions<T, K>): (...args: unknown[]) => unknown {
    const method = instance[methodName];
    if (typeof method !== 'function') throw new BadRequestException(`Method ${String(methodName)} is not a function`);
    return method as (...args: unknown[]) => unknown;
  }

  private setupBasicMiddleware (): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ limit: '10mb', extended: true }));
  }

  private hasInvalidPathSyntax (path: string): boolean {
    if (!path || typeof path !== 'string') return false;
    if (/:[^a-zA-Z0-9]/.test(path)) return true;
    if (path.includes('::') || path.endsWith(':')) return true;
    if (/:[^a-zA-Z0-9_]/.test(path)) return true;
    if (path.includes('://') || path.includes('http:') || path.includes('https:')) return true;

    return false;
  }

  private normalizePath (...segments: string[]): string {
    const cleanSegments = segments
      .filter((segment): segment is string => Boolean(segment && segment.trim() !== ''))
      .map((segment) => {
        let cleaned = segment.trim();

        if (cleaned.includes('://')) return '';
        if (cleaned.startsWith('/')) cleaned = cleaned.substring(1);
        if (cleaned.endsWith('/')) cleaned = cleaned.substring(0, cleaned.length - 1);

        return cleaned;
      })
      .filter((segment): segment is string => segment !== '');

    const path = '/' + cleanSegments.join('/');
    return path === '/' || path === '' ? '/' : path;
  }

  private isValidRoutePath (path: string): boolean {
    if (!path || typeof path !== 'string') return false;
    if (path.length === 0) return false;
    if (!path.startsWith('/')) return false;
    if (path.includes('://')) return false;
    if (this.hasInvalidPathSyntax(path)) return false;
    if (path.includes('//')) return false;

    return true;
  }

  private initialize (): void {
    CONTROLLER_REGISTRY.forEach((controller) => this.registerController(controller));
  }

  private setupPathValidation (): void {
    const methods: HttpMethod[] = [...METHODS];
    const app = this.app as Application & ExpressHttpMethods;

    methods.forEach((method) => {
      const originalMethod = app[method].bind(app);

      const overriddenMethod = (path: string, ...handlers: RequestHandler[]): Application => {
        if (typeof path === 'string' && this.hasInvalidPathSyntax(path)) return app;

        try {
          return originalMethod(path, ...handlers);
        } catch (error) {
          if (error instanceof Error && error.message.includes('Missing parameter name')) return app;
          throw error;
        }
      };

      Object.assign(app, { [method]: overriddenMethod });
    });
  }
}
