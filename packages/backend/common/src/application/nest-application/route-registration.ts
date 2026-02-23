import { Express, Request, Response, NextFunction } from 'express';

import { RequestHandlerFactory } from './request-handler';
import { Container } from '../../core/container/container';
import { CONTROLLER_METADATA } from '../../core/decorators/controller.decorator';
import { ROUTE_METADATA } from '../../core/decorators/route.decorators';
import { BadRequestException } from '../../domain/exceptions/http-exceptions';
import { BaseControllerOptions } from '../../domain/interfaces/api/api.interface';
import { HasMethodOptions } from '../../domain/interfaces/common/util.interface';
import { ControllerDefinitionContext, RouteMetadata } from '../../domain/interfaces/nest/nest-core.interface';
import { ExpressHttpMethod } from '../../domain/types/api/api-http.type';
import { Constructor } from '../../domain/types/common/util.type';

export class RouteRegistration {
  private handlerFactory: RequestHandlerFactory;

  constructor(
    private container: Container,
    private globalPrefix: string
  ) {
    this.handlerFactory = new RequestHandlerFactory(container);
  }

  registerController<T extends object>(app: Express, controllerClass: Constructor<T>): void {
    const metadata = this.getControllerMetadata(controllerClass);
    const instance = this.container.resolve({ provide: controllerClass });
    const methodNames = this.getControllerMethodNames(controllerClass);
    const methodMap = this.createMethodMap(app);

    methodNames.forEach(name => this.registerRoutes({ controllerClass, instance, methodName: name, basePath: metadata.path || '', methodMap }));
  }

  updateGlobalPrefix(prefix: string): string {
    const normalizedPrefix = prefix.trim();
    if (normalizedPrefix.includes('://')) return '';
    let result = normalizedPrefix.startsWith('/') ? normalizedPrefix : '/' + normalizedPrefix;
    if (result.length > 1 && result.endsWith('/')) result = result.substring(0, result.length - 1);
    return result;
  }

  private getControllerMethodNames<T extends object>(controllerClass: Constructor<T>): string[] {
    return Object.getOwnPropertyNames(controllerClass.prototype).filter(name => name !== 'constructor');
  }

  private hasMethod<T extends object>({ instance, methodName }: HasMethodOptions<T>): boolean {
    return methodName in instance && typeof Reflect.get(instance, methodName) === 'function';
  }

  private isValidRoutePath(path: string): boolean {
    if (!path || typeof path !== 'string' || path.length === 0) return false;
    return path.startsWith('/') && !path.includes('://') && !path.includes('//');
  }

  private getControllerMetadata<T extends object>(controllerClass: Constructor<T>): BaseControllerOptions {
    const metadata = Reflect.getMetadata(CONTROLLER_METADATA, controllerClass) as BaseControllerOptions;
    if (!metadata) throw new BadRequestException(`${controllerClass.name} is not marked as @Controller()`);
    return metadata;
  }

  private createMethodMap(app: Express): Record<string, ExpressHttpMethod> {
    return {
      get: app.get.bind(app),
      post: app.post.bind(app),
      put: app.put.bind(app),
      delete: app.delete.bind(app),
      patch: app.patch.bind(app)
    };
  }

  private registerRoutes<T extends object>(opts: ControllerDefinitionContext<T>): void {
    const { controllerClass, instance, methodName, basePath, methodMap } = opts;
    const routes = (Reflect.getMetadata(ROUTE_METADATA as symbol, controllerClass.prototype as object, methodName) || []) as RouteMetadata[];

    routes.forEach(route => {
      const fullPath = this.normalizePath(this.globalPrefix, basePath, route.path);
      if (!this.isValidRoutePath(fullPath)) return;
      if (!this.hasMethod({ instance, methodName })) return;
      const handler = this.handlerFactory.createRequestHandler(controllerClass, instance, methodName);
      const registerFn = methodMap[route.method.toLowerCase()];
      if (registerFn) registerFn(fullPath, (req: Request, res: Response, next: NextFunction) => void handler(req, res, next));
    });
  }

  private normalizePath(...segments: string[]): string {
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
}
