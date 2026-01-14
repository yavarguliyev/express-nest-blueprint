import { CircuitBreakerOptions } from '@common/interfaces/common.interface';

export const CIRCUIT_BREAKER_METADATA = 'circuit:breaker';

export const CircuitBreaker = (options: CircuitBreakerOptions = {}): MethodDecorator => {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CIRCUIT_BREAKER_METADATA, options, target, propertyKey);
    return descriptor;
  };
};
