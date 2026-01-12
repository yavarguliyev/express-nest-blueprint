import { ClassConstructor } from 'class-transformer';
import express, { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import { Server } from 'http';

import { METHODS, paramHandlers } from '@common/constants';
import { Container } from '@common/container';
import { CONTROLLER_METADATA, PARAM_METADATA, ROUTE_METADATA } from '@common/decorators';
import { BadRequestException, UnauthorizedException } from '@common/exceptions';
import { GlobalExceptionFilter } from '@common/filters';
import { AuthGuard, RolesGuard } from '@common/guards';
import { CONTROLLER_REGISTRY } from '@common/helpers';
import { ControllerOptions, CorsOptions, ExtractMethodOptions, HasMethodOptions, ParamMetadata, RouteMetadata } from '@common/interfaces';
import { JwtService } from '@common/services';
import { Constructor, HttpMethod } from '@common/types';

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

        const originalMethod = this.extractMethod({ instance: controllerInstance, methodName: methodName as keyof typeof controllerInstance }) as unknown as Constructor;
        const paramMetadata = (Reflect.getMetadata(PARAM_METADATA as symbol, controllerClass.prototype as object, methodName) || []) as ParamMetadata[];

        const handler = async (req: Request, res: Response, next: NextFunction) => {
          try {
            const jwtService = this.container.resolve({ provide: JwtService });
            const authGuard = new AuthGuard(jwtService);
            const rolesGuard = new RolesGuard();

            await Promise.all([
              new Promise<void>((resolve, reject) => {
                authGuard.canActivate(
                  req,
                  res,
                  (err) => {
                    if (err) reject(err instanceof Error ? err : new UnauthorizedException(err as string));
                    else resolve();
                  },
                  originalMethod,
                  controllerClass
                );
              }),
              new Promise<void>((resolve, reject) => {
                rolesGuard.canActivate(
                  req,
                  res,
                  (err) => {
                    if (err) reject(err instanceof Error ? err : new UnauthorizedException(err as string));
                    else resolve();
                  },
                  originalMethod,
                  controllerClass
                );
              })
            ]);

            const args: unknown[] = [];
            const paramTypes = (Reflect.getMetadata('design:paramtypes', controllerClass.prototype as object, methodName) || []) as ClassConstructor<object>[];

            for (const param of paramMetadata.sort((a, b) => a.index - b.index)) {
              const fn = paramHandlers[param.type];
              if (fn) await fn(param, param.index, args, paramTypes, req);
            }

            const result = await (originalMethod as unknown as (...args: unknown[]) => unknown).apply(controllerInstance, args);

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

  async listen (port: number): Promise<Server> {
    return new Promise((resolve) => (this.server = this.app.listen(port, () => resolve(this.server!))));
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
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
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
    this.setupGlobalErrorHandler();
  }

  private setupPathValidation (): void {
    const methods: HttpMethod[] = [...METHODS];

    methods.forEach((method) => {
      const appAsRecord = this.app as unknown as Record<string, (...args: unknown[]) => unknown>;
      const methodFunction = appAsRecord[method];
      if (!methodFunction || typeof methodFunction !== 'function') return;
      const originalMethod = methodFunction.bind(this.app);

      appAsRecord[method] = (...args: unknown[]): unknown => {
        if (args.length > 0 && typeof args[0] === 'string' && this.hasInvalidPathSyntax(args[0])) return this.app;

        try {
          return originalMethod(...args);
        } catch (error: unknown) {
          const pathError = error as Error & { message: string };
          if (pathError.message && pathError.message.includes('Missing parameter name')) return this.app;
          throw error;
        }
      };
    });
  }
}
