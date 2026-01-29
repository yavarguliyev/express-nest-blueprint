import { NextFunction, Request, Response } from 'express';

import { Constructor } from '../../types/common/util.type';

export interface CanActivate {
  canActivate(req: Request, res: Response, next: NextFunction, originalMethod?: object, controllerClass?: Constructor): void | Promise<void>;
}
