import { Request, Response, NextFunction } from 'express';

import { Injectable } from '@common/decorators/injectable.decorator';
import { IS_PUBLIC_KEY, ROLES_KEY } from '@common/decorators/auth.decorator';
import { Roles } from '@common/enums/common.enum';
import { ForbiddenException, UnauthorizedException } from '@common/exceptions/http-exceptions';
import { CanActivate } from '@common/interfaces/guard.interface';
import { Constructor } from '@common/types/common.type';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate (req: Request, _res: Response, next: NextFunction, originalMethod?: object, controllerClass?: Constructor): void {
    const methodIsPublic = (originalMethod && Reflect.getMetadata(IS_PUBLIC_KEY, originalMethod)) as boolean;
    if (methodIsPublic) return next();

    const methodRoles = (originalMethod && Reflect.getMetadata(ROLES_KEY, originalMethod)) as string[] | undefined;
    const classRoles = (controllerClass && Reflect.getMetadata(ROLES_KEY, controllerClass)) as string[] | undefined;
    const requiredRoles = (methodRoles || classRoles) as Roles[];

    if (!requiredRoles || requiredRoles.length === 0) return next();

    const user = req.user;
    if (!user) throw new UnauthorizedException('Authentication required for role-based access');

    const hasRole = requiredRoles.some((role: Roles) => user.role === role);
    if (!hasRole) throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);

    next();
  }
}
