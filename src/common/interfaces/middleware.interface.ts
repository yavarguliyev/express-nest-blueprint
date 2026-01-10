import { NextFunction, Request, Response } from 'express';

import { RequestMethod } from '@common/enums';
import { Constructor, MiddlewareFunction } from '@common/types';

export interface MiddlewareConfig {
  excludeRoutes: (string | RouteInfo)[];
  middleware: (MiddlewareFunction | NestMiddleware)[];
  routes: (string | RouteInfo)[];
}

export interface MiddlewareConfigProxy {
  exclude(...routes: (string | RouteInfo)[]): MiddlewareConfigProxy;
  forRoutes(...routes: (string | RouteInfo)[]): MiddlewareConfigProxy;
}

export interface MiddlewareConsumer {
  apply(...middleware: (Constructor | MiddlewareFunction | NestMiddleware)[]): MiddlewareConfigProxy;
}

export interface NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void;
}

export interface RouteInfo {
  method?: RequestMethod;
  path: string;
}
