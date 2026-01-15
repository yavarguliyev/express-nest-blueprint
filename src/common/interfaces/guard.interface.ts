import { NextFunction, Request, Response } from 'express';

import { Constructor } from '@common/types';

export interface CanActivate {
  canActivate(req: Request, res: Response, next: NextFunction, originalMethod?: object, controllerClass?: Constructor): void | Promise<void>;
}
