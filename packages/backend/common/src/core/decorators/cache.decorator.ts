import { CacheOptions, InvalidateCacheOptions } from '../../domain/interfaces/infra/infra-common.interface';

export const CACHE_METADATA = Symbol('CACHE_METADATA');
export const INVALIDATE_CACHE_METADATA = Symbol('INVALIDATE_CACHE_METADATA');

export const Cache = (options: CacheOptions = {}): MethodDecorator => {
  return (_target: object, _key: string | symbol, descriptor: PropertyDescriptor): void => {
    Reflect.defineMetadata(CACHE_METADATA, { ...options, methodName: _key }, descriptor.value as object);
  };
};

export const InvalidateCache = (options: InvalidateCacheOptions): MethodDecorator => {
  return (_target: object, _key: string | symbol, descriptor: PropertyDescriptor): void => {
    Reflect.defineMetadata(INVALIDATE_CACHE_METADATA, { ...options, methodName: _key }, descriptor.value as object);
  };
};
