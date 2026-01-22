import { CacheOptions } from '../../domain/interfaces/common.interface';

export const CACHE_METADATA = Symbol('CACHE_METADATA');

export const Cache = (options: CacheOptions = {}): MethodDecorator => {
  return (_target: object, _key: string | symbol, descriptor: PropertyDescriptor): void => {
    Reflect.defineMetadata(CACHE_METADATA, { ...options, methodName: _key }, descriptor.value as object);
  };
};
