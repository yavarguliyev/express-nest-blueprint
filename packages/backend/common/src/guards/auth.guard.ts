import { Request, Response, NextFunction } from 'express';

import { IS_PUBLIC_KEY, REQUIRE_AUTH_KEY } from '../decorators/auth.decorator';
import { Injectable } from '../decorators/injectable.decorator';
import { UnauthorizedException } from '../exceptions/http-exceptions';
import { CanActivate } from '../interfaces/guard.interface';
import { Constructor } from '../types/common.type';
import { JwtService } from '../services/jwt.service';

@Injectable()
export class AuthGuard implements CanActivate {
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
    if (!token) throw new UnauthorizedException('Access token is required');

    try {
      req.user = this.jwtService.verify(token);
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
