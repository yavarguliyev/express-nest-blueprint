import { InjectionToken } from '@common/types/common.type';

export const INJECTABLE_METADATA = Symbol.for('INJECTABLE_METADATA');
export const INJECT_METADATA = Symbol.for('INJECT_METADATA');

export const Injectable = (): ClassDecorator => {
  return (target: object): void => {
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target);
  };
};

export const Inject = (token: string | symbol): ParameterDecorator => {
  return (target: object, _propertyKey: string | symbol | undefined, parameterIndex: number): void => {
    const existingTokens = (Reflect.getMetadata(INJECT_METADATA, target) || []) as InjectionToken[];
    existingTokens[parameterIndex] = token;
    Reflect.defineMetadata(INJECT_METADATA, existingTokens, target);
  };
};
