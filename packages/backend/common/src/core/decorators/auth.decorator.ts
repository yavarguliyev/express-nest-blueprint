export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';
export const REQUIRE_AUTH_KEY = 'requireAuth';

export const RequireAuth = (): MethodDecorator & ClassDecorator => {
  return (target: object, _?: string | symbol, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(REQUIRE_AUTH_KEY, true, (descriptor?.value as unknown) || target);
  };
};

export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator => {
  return (target: object, _?: string | symbol, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(REQUIRE_AUTH_KEY, true, (descriptor?.value as unknown) || target);
    Reflect.defineMetadata(ROLES_KEY, roles, (descriptor?.value as unknown) || target);
  };
};

export const Public = (): MethodDecorator & ClassDecorator => {
  return (target: object, _?: string | symbol, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, (descriptor?.value as unknown) || target);
  };
};
