import { INJECTABLE_METADATA } from '@common/decorators/injectable.decorator';
import { ModuleMetadata } from '@common/interfaces/common.interface';

export const MODULE_METADATA = Symbol.for('MODULE_METADATA');

export const Module = (metadata: ModuleMetadata): ClassDecorator => {
  return (target: object): void => {
    Reflect.defineMetadata(MODULE_METADATA, metadata, target);
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target);
  };
};
