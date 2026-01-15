export const API_SECURITY_KEY = 'swagger/api_security';

export const ApiSecurity = (name: string): ClassDecorator & MethodDecorator => {
  return (target: object, _key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      const securities = (Reflect.getMetadata(API_SECURITY_KEY, descriptor.value as object) || []) as object[];
      securities.push({ [name]: [] });
      Reflect.defineMetadata(API_SECURITY_KEY, securities, descriptor.value as object);
    } else {
      const securities = (Reflect.getMetadata(API_SECURITY_KEY, target) || []) as object[];
      securities.push({ [name]: [] });
      Reflect.defineMetadata(API_SECURITY_KEY, securities, target);
    }
  };
};

export const ApiBearerAuth = (name: string = 'bearer'): ClassDecorator & MethodDecorator => ApiSecurity(name);
