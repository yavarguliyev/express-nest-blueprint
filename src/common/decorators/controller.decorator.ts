import 'reflect-metadata';

import { registerControllerClass } from '@common/helpers';
import { Constructor } from '@common/types';

export const CONTROLLER_METADATA = Symbol('CONTROLLER_METADATA');

export const Controller = (path = ''): ClassDecorator => {
  return (target: object): void => {
    Reflect.defineMetadata(CONTROLLER_METADATA, { path }, target);
    registerControllerClass(target as Constructor);
  };
};
