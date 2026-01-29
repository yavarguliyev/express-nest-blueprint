import { Request, Response, NextFunction } from 'express';
import { ClassConstructor } from 'class-transformer';

import { ParamMetadata } from '../../interfaces/nest/nest-core.interface';
import { NestMiddleware } from '../../interfaces/nest/middleware.interface';

export type GraphQLContext = {
  req: Request;
  res: Response;
};

export type ParamSource = 'body' | 'headers' | 'param' | 'query' | 'request' | 'response' | 'user';

export type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

export type MiddlewareNewConstructor = new () => NestMiddleware;

export type ParamHandler = (
  param: ParamMetadata,
  index: number,
  args: unknown[],
  paramTypes: ClassConstructor<object>[],
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;
