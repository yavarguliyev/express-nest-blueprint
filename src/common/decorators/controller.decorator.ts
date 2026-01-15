import { INJECTABLE_METADATA } from '@common/decorators/injectable.decorator';
import { registerControllerClass } from '@common/helpers';
import { Constructor } from '@common/types';

export const CONTROLLER_METADATA = Symbol.for('CONTROLLER_METADATA');

export const Controller = (path = ''): ClassDecorator => {
  return (target: object): void => {
    Reflect.defineMetadata(CONTROLLER_METADATA, { path }, target);
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target);
    registerControllerClass(target as Constructor);
  };
};
