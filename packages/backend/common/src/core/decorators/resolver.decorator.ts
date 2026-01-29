import { INJECTABLE_METADATA } from './injectable.decorator';
import { RESOLVER_METADATA } from '../../domain/constants/web/web.const';
import { Constructor, TypeFunc } from '../../domain/types/common/util.type';

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
