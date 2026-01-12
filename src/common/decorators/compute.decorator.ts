
import { ComputeOptions } from '@common/interfaces';

export const COMPUTE_METADATA = Symbol('COMPUTE_METADATA');

export const Compute = (options: ComputeOptions = {}): MethodDecorator => {
  return (_target: object, _propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(COMPUTE_METADATA, options, descriptor.value as object);
    return descriptor;
  };
};
