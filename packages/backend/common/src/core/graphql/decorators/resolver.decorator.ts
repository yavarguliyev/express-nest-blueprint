import { INJECTABLE_METADATA } from '../../decorators/injectable.decorator';
import { Constructor } from '../../../domain/types/common.type';
import { TypeFunc, RESOLVER_METADATA } from '../interfaces/graphql.interface';

export { RESOLVER_METADATA };
export const RESOLVER_REGISTRY: Constructor[] = [];

export const Resolver = (typeFunc?: TypeFunc): ClassDecorator => {
  return (target: object): void => {
    const constructor = target as Constructor;
    const resolverName = constructor.name.replace('Resolver', '');
    
    Reflect.defineMetadata(RESOLVER_METADATA, { name: resolverName, typeFunc }, target);
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target);
    RESOLVER_REGISTRY.push(constructor);
  };
};

export const registerResolver = (resolver: Constructor): void => {
  if (!RESOLVER_REGISTRY.includes(resolver)) {
    RESOLVER_REGISTRY.push(resolver);
  }
};
