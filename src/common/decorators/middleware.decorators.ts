
import { Constructor } from '@common/types';

export const GUARDS_METADATA = Symbol('GUARDS_METADATA');
export const INTERCEPTORS_METADATA = Symbol('INTERCEPTORS_METADATA');
export const PIPES_METADATA = Symbol('PIPES_METADATA');

export const UseGuards = (...guards: Constructor[]): MethodDecorator & ClassDecorator => {
  return (target: object, propertyKey?: string | symbol) => {
    if (propertyKey) Reflect.defineMetadata(GUARDS_METADATA, guards, target, propertyKey);
    else Reflect.defineMetadata(GUARDS_METADATA, guards, target);
  };
};

export const UseInterceptors = (...interceptors: Constructor[]): MethodDecorator & ClassDecorator => {
  return (target: object, propertyKey?: string | symbol) => {
    if (propertyKey) Reflect.defineMetadata(INTERCEPTORS_METADATA, interceptors, target, propertyKey);
    else Reflect.defineMetadata(INTERCEPTORS_METADATA, interceptors, target);
  };
};

export const UsePipes = (...pipes: Constructor[]): MethodDecorator & ClassDecorator => {
  return (target: object, propertyKey?: string | symbol) => {
    if (propertyKey) Reflect.defineMetadata(PIPES_METADATA, pipes, target, propertyKey);
    else Reflect.defineMetadata(PIPES_METADATA, pipes, target);
  };
};
