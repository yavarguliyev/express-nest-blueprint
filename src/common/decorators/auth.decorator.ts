import 'reflect-metadata';

export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';
export const REQUIRE_AUTH_KEY = 'requireAuth';

export const RequireAuth = () => {
  return (target: object, _?: string | symbol, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(REQUIRE_AUTH_KEY, true, (descriptor?.value as unknown) || target);
  };
};

export const Roles = (...roles: string[]) => {
  return (target: object, _?: string | symbol, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(REQUIRE_AUTH_KEY, true, (descriptor?.value as unknown) || target);
    Reflect.defineMetadata(ROLES_KEY, roles, (descriptor?.value as unknown) || target);
  };
};

export const Public = () => {
  return (target: object, _?: string | symbol, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, (descriptor?.value as unknown) || target);
  };
};
