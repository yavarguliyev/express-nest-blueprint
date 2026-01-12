import 'reflect-metadata';

export const CIRCUIT_BREAKER_METADATA = 'circuit:breaker';

export interface CircuitBreakerOptions {
  key?: string;
  threshold?: number;
  timeout?: number;
}

export function CircuitBreaker (options: CircuitBreakerOptions = {}): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CIRCUIT_BREAKER_METADATA, options, target, propertyKey);
    return descriptor;
  };
}
