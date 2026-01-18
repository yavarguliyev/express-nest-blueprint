import { RouteMetadata } from '../interfaces/common.interface';

export const ROUTE_METADATA = Symbol.for('ROUTE_METADATA');

export const createRouteDecorator = (method: string) => {
  return (path = ''): MethodDecorator => {
    return (target: object, propertyKey: string | symbol | undefined): void => {
      if (propertyKey) {
        const existingRoutes = (Reflect.getMetadata(ROUTE_METADATA as unknown, target, propertyKey) || []) as RouteMetadata[];
        existingRoutes.push({ method, path });

        Reflect.defineMetadata(ROUTE_METADATA, existingRoutes, target, propertyKey);
      }
    };
  };
};

export const Get = createRouteDecorator('get');
export const Post = createRouteDecorator('post');
export const Put = createRouteDecorator('put');
export const Delete = createRouteDecorator('delete');
export const Patch = createRouteDecorator('patch');
