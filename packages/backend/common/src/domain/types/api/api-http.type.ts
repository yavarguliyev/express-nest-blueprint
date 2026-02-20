import { Application } from 'express';
import { PathParams, RequestHandlerParams } from 'express-serve-static-core';

import { METHODS } from '../../constants/api/api.const';
import { BaseControllerOptions } from 'domain/interfaces/api/api.interface';

export type HttpMethod = (typeof METHODS)[number];

export type ExpressHttpMethod = (path: PathParams, ...handlers: RequestHandlerParams[]) => Application;

export type ExpressHttpMethods = {
  [K in HttpMethod]: ExpressHttpMethod;
};
export type ApiControllerOptions = BaseControllerOptions;
