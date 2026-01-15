import { ParamMetadata } from '@common/interfaces';

export const PARAM_METADATA = Symbol.for('PARAM_METADATA');

export const createParamDecorator = (type: ParamMetadata['type']) => {
  return (data?: unknown): ParameterDecorator => {
    return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void => {
      if (propertyKey) {
        const existingParams = (Reflect.getMetadata(PARAM_METADATA as unknown, target, propertyKey) || []) as ParamMetadata[];
        existingParams.push({ index: parameterIndex, type, data });

        Reflect.defineMetadata(PARAM_METADATA, existingParams, target, propertyKey);
      }
    };
  };
};

export const Body = createParamDecorator('body');
export const Param = createParamDecorator('param');
export const Query = createParamDecorator('query');
export const Headers = createParamDecorator('headers');
export const Req = createParamDecorator('request');
export const Res = createParamDecorator('response');
