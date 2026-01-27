import { INJECTABLE_METADATA } from './injectable.decorator';
import { registerControllerClass } from './register-controller-class.decorator';
import { Constructor } from '../../domain/types/common.type';

export const CONTROLLER_METADATA = Symbol.for('CONTROLLER_METADATA');

export const Controller = (path = ''): ClassDecorator => {
  return (target: object): void => {
    Reflect.defineMetadata(CONTROLLER_METADATA, { path }, target);
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target);
    registerControllerClass(target as Constructor);
  };
};
