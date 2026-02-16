import 'reflect-metadata';
import { ClassConstructor } from 'class-transformer';
import express, { Express, Request, Response, NextFunction, RequestHandler, Application } from 'express';
import { PathParams, RequestHandlerParams } from 'express-serve-static-core';
import { Server } from 'http';

import { Container } from '../core/container/container';
import { CONTROLLER_METADATA } from '../core/decorators/controller.decorator';
import { GUARDS_METADATA } from '../core/decorators/middleware.decorators';
import { PARAM_METADATA } from '../core/decorators/param.decorators';
import { CONTROLLER_REGISTRY } from '../core/decorators/register-controller-class.decorator';
import { ROUTE_METADATA } from '../core/decorators/route.decorators';
import { GlobalExceptionFilter } from '../core/filters/global-exception.filter';
import { AuthGuard } from '../core/guards/auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { METHODS } from '../domain/constants/api/api.const';
import { paramHandlers } from '../domain/constants/nest/nest.const';
import { BadRequestException, UnauthorizedException, InternalServerErrorException } from '../domain/exceptions/http-exceptions';
import { getErrorMessage } from '../domain/helpers/utility-functions.helper';
import { ControllerOptions, CorsOptions } from '../domain/interfaces/api/api.interface';
import { HasMethodOptions, ExtractMethodOptions } from '../domain/interfaces/common/util.interface';
import { CanActivate } from '../domain/interfaces/nest/guard.interface';
import { RouteMetadata, ParamMetadata } from '../domain/interfaces/nest/nest-core.interface';
import { ExpressHttpMethods, ExpressHttpMethod } from '../domain/types/api/api-http.type';
import { Constructor } from '../domain/types/common/util.type';

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

  init = (): void => this.initialize();
  getExpressApp = (): Express => this.app;
  getContainer = (): Container => this.container;
  get = <T extends object>(provide: Constructor<T> | string | symbol): T => this.container.resolve({ provide });

  registerController<T extends object> (controllerClass: Constructor<T>): void {
    const metadata = this.getControllerMetadata(controllerClass);
    const instance = this.container.resolve({ provide: controllerClass });
    const methodNames = this.getControllerMethodNames(controllerClass);
    const methodMap = this.createMethodMap();

    methodNames.forEach(name => this.registerRoutes(controllerClass, instance, name, metadata.path || '', methodMap));
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

    this.globalPrefix = normalizedPrefix.startsWith('/') ? normalizedPrefix : '/' + normalizedPrefix;
    if (this.globalPrefix.length > 1 && this.globalPrefix.endsWith('/')) {
      this.globalPrefix = this.globalPrefix.substring(0, this.globalPrefix.length - 1);
    }
  }

  async close (): Promise<void> {
    if (this.server?.listening) await new Promise<void>((resolve, reject) => this.server!.close(error => (error ? reject(error) : resolve())));
    this.container.clear();
  }

  private getControllerMetadata<T extends object> (controllerClass: Constructor<T>): ControllerOptions {
    const metadata = Reflect.getMetadata(CONTROLLER_METADATA, controllerClass) as ControllerOptions;
    if (!metadata) throw new BadRequestException(`${controllerClass.name} is not marked as @Controller()`);
    return metadata;
  }

  private getControllerMethodNames<T extends object> (controllerClass: Constructor<T>): string[] {
    return Object.getOwnPropertyNames(controllerClass.prototype).filter(name => name !== 'constructor');
  }

  private createMethodMap (): Record<string, ExpressHttpMethod> {
    return {
      get: this.app.get.bind(this.app),
      post: this.app.post.bind(this.app),
      put: this.app.put.bind(this.app),
      delete: this.app.delete.bind(this.app),
      patch: this.app.patch.bind(this.app)
    };
  }

  private registerRoutes<T extends object> (
    controllerClass: Constructor<T>,
    instance: T,
    methodName: string,
    basePath: string,
    methodMap: Record<string, ExpressHttpMethod>
  ): void {
    const routes = (Reflect.getMetadata(ROUTE_METADATA as symbol, controllerClass.prototype as object, methodName) || []) as RouteMetadata[];

    routes.forEach(route => {
      const fullPath = this.normalizePath(this.globalPrefix, basePath, route.path);
      if (!this.isValidRoutePath(fullPath)) return;
      if (!this.hasMethod({ instance, methodName })) return;

      const handler = this.createRequestHandler(controllerClass, instance, methodName);
      const registerFn = methodMap[route.method.toLowerCase()];
      if (registerFn) registerFn(fullPath, (req: Request, res: Response, next: NextFunction) => void handler(req, res, next));
    });
  }

  private createRequestHandler<T extends object> (controllerClass: Constructor<T>, instance: T, methodName: string): RequestHandler {
    const originalMethod = this.extractMethod({ instance, methodName: methodName as keyof T }) as (...args: unknown[]) => Promise<unknown>;
    const paramMetadata = (Reflect.getMetadata(PARAM_METADATA as symbol, controllerClass.prototype as object, methodName) || []) as ParamMetadata[];

    return (req: Request, res: Response, next: NextFunction) => {
      void (async (): Promise<void> => {
        try {
          await this.runGuards(req, res, controllerClass, methodName, originalMethod);
          const args = await this.resolveArguments(req, res, next, controllerClass, methodName, paramMetadata);
          const result = await originalMethod.apply(instance, args);
          this.handleResponse(res, result, paramMetadata);
        } catch (err) {
          next(err);
        }
      })();
    };
  }

  private async runGuards<T extends object> (
    req: Request,
    res: Response,
    controllerClass: Constructor<T>,
    methodName: string,
    method: (...args: unknown[]) => Promise<unknown>
  ): Promise<void> {
    const classGuards = (Reflect.getMetadata(GUARDS_METADATA, controllerClass) || []) as Constructor<CanActivate>[];
    const methodGuards = (Reflect.getMetadata(GUARDS_METADATA, controllerClass.prototype as object, methodName) || []) as Constructor<CanActivate>[];
    const guards = [AuthGuard, RolesGuard, ...classGuards, ...methodGuards];

    for (const GuardClass of guards) {
      const guard = this.container.resolve<CanActivate>({ provide: GuardClass });
      await new Promise<void>((resolve, reject) => {
        void guard.canActivate(
          req,
          res,
          (err?: Error | string) => (err ? reject(new UnauthorizedException(String(getErrorMessage(err)))) : resolve()),
          method,
          controllerClass
        );
      });
    }
  }

  private async resolveArguments<T extends object> (
    req: Request,
    res: Response,
    next: NextFunction,
    controllerClass: Constructor<T>,
    methodName: string,
    paramMetadata: ParamMetadata[]
  ): Promise<unknown[]> {
    const args: unknown[] = [];
    const paramTypes = (Reflect.getMetadata('design:paramtypes', controllerClass.prototype as object, methodName) ||
      []) as ClassConstructor<object>[];

    for (const param of paramMetadata.sort((a, b) => a.index - b.index)) {
      const handler = paramHandlers[param.type];
      if (handler) await handler(param, param.index, args, paramTypes, req, res, next);
    }

    return args;
  }

  private handleResponse (res: Response, result: unknown, paramMetadata: ParamMetadata[]): void {
    if (res.headersSent) return;

    const isPassthrough = paramMetadata.some(
      p => p.type === 'response' && typeof p.data === 'object' && p.data !== null && (p.data as { passthrough?: boolean }).passthrough
    );

    if (isPassthrough) {
      if (result !== undefined) res.send(result);
      return;
    }

    res.json({ success: true, data: result, message: 'Operation completed successfully' });
  }

  async listen (port: number, host?: string): Promise<Server> {
    this.setupGlobalErrorHandler();
    return this.attemptListenWithRetries(port, host);
  }

  private async attemptListenWithRetries (port: number, host?: string, maxRetries = 30): Promise<Server> {
    let retries = 0;

    const attempt = (): Promise<Server> => {
      return new Promise((resolve, reject) => {
        const server = this.app.listen(port, host as string, () => {
          this.server = server;
          resolve(server);
        });

        server.once('error', (err: unknown) => this.handleListenError(err, server, retries++, maxRetries, port, host, resolve, reject, attempt));
      });
    };

    return attempt();
  }

  private handleListenError (
    err: unknown,
    server: Server,
    retries: number,
    maxRetries: number,
    _port: number,
    _host: string | undefined,
    resolve: (server: Server) => void,
    reject: (err: Error) => void,
    retryFn: () => Promise<Server>
  ): void {
    void (async (): Promise<void> => {
      const error = err as Error & { code?: string };
      if (error.code === 'EADDRINUSE' && retries < maxRetries) {
        await new Promise<void>(closeResolve => server.close(() => closeResolve()));
        setTimeout(() => void retryFn().then(resolve).catch(reject), 500);
      } else reject(new InternalServerErrorException(getErrorMessage(error)));
    })();
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
    const invalidPatterns = [/:[^a-zA-Z0-9]/, /::/, /:$/, /:[^a-zA-Z0-9_]/, /:\/\//, /http:/, /https:/];
    return invalidPatterns.some(pattern => pattern.test(path));
  }

  private normalizePath (...segments: string[]): string {
    const cleanSegments = segments
      .filter(s => Boolean(s && s.trim() !== ''))
      .map(s => {
        let clean = s.trim();
        if (clean.includes('://')) return '';
        if (clean.startsWith('/')) clean = clean.substring(1);
        if (clean.endsWith('/')) clean = clean.substring(0, clean.length - 1);
        return clean;
      })
      .filter(s => s !== '');

    const path = '/' + cleanSegments.join('/');
    return path === '' ? '/' : path;
  }

  private isValidRoutePath (path: string): boolean {
    if (!path || typeof path !== 'string' || path.length === 0) return false;
    return path.startsWith('/') && !path.includes('://') && !this.hasInvalidPathSyntax(path) && !path.includes('//');
  }

  private initialize = (): void => CONTROLLER_REGISTRY.forEach(controller => this.registerController(controller));

  private setupPathValidation (): void {
    const app = this.app as unknown as Application & ExpressHttpMethods;
    METHODS.forEach(method => {
      const original = (app[method] as (...args: unknown[]) => unknown).bind(app);
      if (original) {
        const target = app as unknown as Record<string, ExpressHttpMethod>;
        target[method] = this.createValidatedMethod(original, app);
      }
    });
  }

  private createValidatedMethod (original: (...args: unknown[]) => unknown, app: Application): ExpressHttpMethod {
    return (path: PathParams, ...handlers: RequestHandlerParams[]) => {
      if (typeof path === 'string' && this.hasInvalidPathSyntax(path)) return app;
      try {
        return original(path, ...handlers) as Application;
      } catch (error) {
        if (error instanceof Error && error.message.includes('Missing parameter name')) return app;
        throw error;
      }
    };
  }
}
