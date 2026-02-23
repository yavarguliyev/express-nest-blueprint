import { REQUIRE_AUTH_KEY, ROLES_KEY, IS_PUBLIC_KEY } from '../../decorators/auth.decorator';
import { GUARDS_METADATA } from '../../decorators/middleware.decorators';
import { API_SECURITY_KEY } from '../../decorators/swagger.decorators';
import { SecurityMetadata } from '../../../domain/interfaces/api/api.interface';
import { Constructor } from '../../../domain/types/common/util.type';

export class MetadataExtractor {
  extractSecurityMetadata (
    controller: Constructor,
    prototype: object,
    methodName: string,
    controllerRequiresAuth: boolean,
    controllerIsPublic: boolean
  ): SecurityMetadata {
    const methodRequiresAuth = Reflect.getMetadata(REQUIRE_AUTH_KEY, prototype, methodName) as boolean;
    const methodIsPublic = Reflect.getMetadata(IS_PUBLIC_KEY, prototype, methodName) as boolean;
    const roles = Reflect.getMetadata(ROLES_KEY, prototype, methodName) as string[];
    const requiresAuth = this.determineAuthRequirement(methodIsPublic, methodRequiresAuth, controllerIsPublic, controllerRequiresAuth);
    const hasHeaderAuth = this.checkHeaderAuth(controller, prototype, methodName);
    const security = this.extractSecuritySchemes(controller, prototype, methodName);

    return {
      requiresAuth,
      roles,
      security,
      hasHeaderAuth
    };
  }

  private determineAuthRequirement (
    methodIsPublic: boolean,
    methodRequiresAuth: boolean,
    controllerIsPublic: boolean,
    controllerRequiresAuth: boolean
  ): boolean {
    if (methodIsPublic) return false;
    if (methodRequiresAuth) return true;
    if (controllerIsPublic) return false;
    if (controllerRequiresAuth) return true;
    return false;
  }

  private checkHeaderAuth (controller: Constructor, prototype: object, methodName: string): boolean {
    const classGuards = (Reflect.getMetadata(GUARDS_METADATA, controller) || []) as Constructor[];
    const methodGuards = (Reflect.getMetadata(GUARDS_METADATA, prototype, methodName) || []) as Constructor[];
    const allGuards = [...classGuards, ...methodGuards].filter((guard): guard is Constructor => typeof guard === 'function');
    return allGuards.some(guard => guard.name === 'HeaderAuthGuard');
  }

  private extractSecuritySchemes (controller: Constructor, prototype: object, methodName: string): Record<string, string[]>[] | undefined {
    const methodSecurity = Reflect.getMetadata(API_SECURITY_KEY, prototype, methodName) as Record<string, string[]>[];
    const controllerSecurity = Reflect.getMetadata(API_SECURITY_KEY, controller) as Record<string, string[]>[];
    if (methodSecurity || controllerSecurity) return [...(methodSecurity || []), ...(controllerSecurity || [])];
    return undefined;
  }
}
