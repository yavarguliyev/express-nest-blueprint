import { ExceptionClass } from '@common/types/common.type';

export const EXCEPTION_FILTERS_METADATA = 'EXCEPTION_FILTERS_METADATA';

export const Catch = <T extends Error, Args extends unknown[]>(...exceptions: ExceptionClass<T, Args>[]): MethodDecorator & ClassDecorator => {
  return (target: object): void => Reflect.defineMetadata(EXCEPTION_FILTERS_METADATA, exceptions, target);
};
