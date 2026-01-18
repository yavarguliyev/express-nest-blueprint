import { Express, Request, Response, NextFunction, RequestHandler } from 'express';

import { Container } from '../container/container';
import { CONTROLLER_METADATA } from '../decorators/controller.decorator';
import { RequestMethod } from '../enums/common.enum';
import { ControllerOptions } from '../interfaces/common.interface';
import { MiddlewareConsumer, MiddlewareConfigProxy, NestMiddleware, RouteInfo, MiddlewareConfig } from '../interfaces/middleware.interface';
import { createMethodMap, isMiddlewareConstructor, isNestMiddleware } from '../helpers/utility-functions.helper';
import { Constructor, MiddlewareFunction, MiddlewareNewConstructor } from '../types/common.type';

export class MiddlewareConsumerImpl implements MiddlewareConsumer {
  private middlewareConfigs: MiddlewareConfig[] = [];

  constructor (
    private app: Express,
    private container: Container
  ) {}

  apply (...middleware: (MiddlewareFunction | NestMiddleware)[]): MiddlewareConfigProxy {
    const config: MiddlewareConfig = { middleware, routes: [], excludeRoutes: [] };

    const proxy: MiddlewareConfigProxy = {
      forRoutes: (...routes: (string | RouteInfo)[]): MiddlewareConfigProxy => {
        config.routes = routes;

        this.middlewareConfigs.push(config);
        this.applyMiddleware(config);

        return proxy;
      },
      exclude: (...routes: (string | RouteInfo)[]): MiddlewareConfigProxy => {
        config.excludeRoutes = routes;

        return proxy;
      }
    };

    return proxy;
  }

  applyGlobalMiddleware (config: MiddlewareConfig): void {
    this.middlewareConfigs.push(config);
    this.applyMiddleware(config);
  }

  private applyMiddleware (config: MiddlewareConfig): void {
    const methodMap = createMethodMap(this.app);

    config.middleware.forEach((mw) => {
      const wrappedMiddleware = this.wrapMiddlewareWithExclusions(mw, config.excludeRoutes) as RequestHandler;

      if (config.routes.length === 0) {
        this.app.use(wrappedMiddleware);
      } else {
        config.routes.forEach((route) => {
          const routePath = this.getRoutePath(route);
          const method = this.getRouteMethod(route);

          const registerFn = method && methodMap[method] ? methodMap[method] : this.app.use.bind(this.app);
          registerFn(routePath, wrappedMiddleware);
        });
      }
    });
  }

  private wrapMiddleware (middleware: MiddlewareFunction | NestMiddleware | MiddlewareNewConstructor) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        if (isMiddlewareConstructor(middleware)) return this.container.resolve({ provide: middleware as Constructor<NestMiddleware> }).use(req, res, next);
        else if (isNestMiddleware(middleware)) return middleware.use(req, res, next);
        else next();
      } catch (error) {
        next(error);
      }
    };
  }

  private wrapMiddlewareWithExclusions (middleware: MiddlewareFunction | NestMiddleware | MiddlewareNewConstructor, excludeRoutes: (string | RouteInfo)[]) {
    const wrappedMiddleware = this.wrapMiddleware(middleware);

    if (excludeRoutes.length === 0) return wrappedMiddleware;

    return (req: Request, res: Response, next: NextFunction) => {
      const shouldExclude = excludeRoutes.some((excludeRoute) => {
        const excludePath = typeof excludeRoute === 'string' ? excludeRoute : excludeRoute.path;
        const excludeMethod = typeof excludeRoute === 'object' ? excludeRoute.method : undefined;
        const pathMatches = this.matchPath(req.path, excludePath);
        const method = req.method.toUpperCase() as RequestMethod;
        const methodMatches = !excludeMethod || excludeMethod === RequestMethod.ALL || method === excludeMethod;

        return pathMatches && methodMatches;
      });

      if (shouldExclude) return next();

      return wrappedMiddleware(req, res, next);
    };
  }

  private matchPath (requestPath: string, routePath: string): boolean {
    if (requestPath === routePath) return true;
    if (routePath === '*') return true;
    if (routePath.endsWith('*')) return requestPath.startsWith(routePath.slice(0, -1));

    const routeSegments = routePath.split('/');
    const pathSegments = requestPath.split('/');

    if (routeSegments.length !== pathSegments.length) return false;

    return routeSegments.every((segment, index) => segment.startsWith(':') || segment === pathSegments[index]);
  }

  private getRoutePath (route: string | Constructor | RouteInfo): string {
    if (typeof route === 'string') {
      if (route === '*') return '*';
      return route.startsWith('/') ? route : `/${route}`;
    }

    if (typeof route === 'function') {
      const controllerMetadata = Reflect.getMetadata(CONTROLLER_METADATA as symbol, route) as ControllerOptions;
      const path = controllerMetadata?.path || '';

      return path.startsWith('/') ? path : `/${path}`;
    }

    const path = route.path;
    return path.startsWith('/') ? path : `/${path}`;
  }

  private getRouteMethod (route: string | Constructor | RouteInfo): RequestMethod | undefined {
    if (typeof route === 'object' && 'method' in route) return route.method;
    return undefined;
  }
}
