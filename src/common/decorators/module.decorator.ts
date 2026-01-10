import { INJECTABLE_METADATA } from '@common/decorators/injectable.decorator';
import { ModuleMetadata } from '@common/interfaces';

export const MODULE_METADATA = Symbol('MODULE_METADATA');

export const Module = (metadata: ModuleMetadata): ClassDecorator => {
  return (target: object): void => {
    Reflect.defineMetadata(MODULE_METADATA, metadata, target);
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target);
  };
};
