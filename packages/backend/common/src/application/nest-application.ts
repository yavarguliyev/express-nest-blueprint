import 'reflect-metadata';
import express, { Express, RequestHandler } from 'express';
import { Server } from 'http';

import { LifecycleHooks } from './nest-application/lifecycle-hooks';
import { MiddlewareSetup } from './nest-application/middleware-setup';
import { RouteRegistration } from './nest-application/route-registration';
import { Container } from '../core/container/container';
import { CONTROLLER_REGISTRY } from '../core/decorators/register-controller-class.decorator';
import { CorsOptions } from '../domain/interfaces/api/api.interface';
import { Constructor } from '../domain/types/common/util.type';

export class NestApplication {
  private app: Express;
  private container: Container;
  private middlewareSetup: MiddlewareSetup;
  private routeRegistration: RouteRegistration;
  private lifecycleHooks: LifecycleHooks;
  private globalPrefix = '';

  constructor(container: Container) {
    this.app = express();
    this.container = container;
    this.middlewareSetup = new MiddlewareSetup();
    this.routeRegistration = new RouteRegistration(container, this.globalPrefix);
    this.lifecycleHooks = new LifecycleHooks();
    this.middlewareSetup.setupBasicMiddleware(this.app);
    this.lifecycleHooks.setupPathValidation(this.app);
  }

  init = (): void => this.initialize();
  getExpressApp = (): Express => this.app;
  getContainer = (): Container => this.container;
  get = <T extends object>(provide: Constructor<T> | string | symbol): T => this.container.resolve({ provide });
  enableCors = (options?: CorsOptions): void => this.middlewareSetup.enableCors(this.app, options);
  listen = async (port: number, host?: string): Promise<Server> => this.lifecycleHooks.listen(this.app, port, host);

  registerController<T extends object>(controllerClass: Constructor<T>): void {
    this.routeRegistration.registerController(this.app, controllerClass);
  }

  setGlobalPrefix(prefix: string): void {
    this.globalPrefix = this.routeRegistration.updateGlobalPrefix(prefix);
    this.routeRegistration = new RouteRegistration(this.container, this.globalPrefix);
  }

  use(middleware: RequestHandler): this;
  use(path: string, middleware: RequestHandler): this;
  use(pathOrMiddleware: string | RequestHandler, middleware?: RequestHandler): this {
    this.middlewareSetup.applyMiddleware(this.app, pathOrMiddleware, middleware);
    return this;
  }

  async close(): Promise<void> {
    await this.lifecycleHooks.close();
    this.container.clear();
  }

  private initialize = (): void => CONTROLLER_REGISTRY.forEach(controller => this.registerController(controller));
}
