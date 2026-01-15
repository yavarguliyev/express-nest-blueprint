import { Request, Response, NextFunction } from 'express';

import { Injectable, IS_PUBLIC_KEY, REQUIRE_AUTH_KEY } from '@common/decorators';
import { ForbiddenException, UnauthorizedException } from '@common/exceptions';
import { CanActivate } from '@common/interfaces';
import { Roles } from '@common/enums';
import { Constructor } from '@common/types';
import { JwtService } from '@common/services';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor (private readonly jwtService: JwtService) {}

  canActivate (req: Request, _res: Response, next: NextFunction, originalMethod?: object, controllerClass?: Constructor): void {
    const methodIsPublic = (originalMethod && Reflect.getMetadata(IS_PUBLIC_KEY, originalMethod)) as boolean;
    if (methodIsPublic) return next();

    const methodRequiresAuth = (originalMethod && Reflect.getMetadata(REQUIRE_AUTH_KEY, originalMethod)) as boolean;
    const classIsPublic = (controllerClass && Reflect.getMetadata(IS_PUBLIC_KEY, controllerClass)) as boolean;
    const classRequiresAuth = (controllerClass && Reflect.getMetadata(REQUIRE_AUTH_KEY, controllerClass)) as boolean;

    let requiresAuth = false;

    if (methodRequiresAuth !== undefined) requiresAuth = methodRequiresAuth;
    else if (classRequiresAuth !== undefined) requiresAuth = classRequiresAuth;
    else if (classIsPublic) requiresAuth = false;

    if (req.path.includes('/auth/') || !requiresAuth) return next();

    const token = this.extractTokenFromHeader(req);
    if (!token) throw new UnauthorizedException('Access token is required for admin access');

    try {
      const user = this.jwtService.verify(token);
      req.user = user;

      if (user.role !== Roles.ADMIN) throw new ForbiddenException(`Admin access required. Current role: ${user.role}`);

      next();
    } catch {
      return next(new UnauthorizedException('Invalid or expired token'));
    }
  }

  private extractTokenFromHeader (request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
