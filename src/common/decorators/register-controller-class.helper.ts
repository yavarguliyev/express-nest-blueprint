import { Constructor } from '@common/types/common.type';

export const CONTROLLER_REGISTRY = new Set<Constructor>();

export const registerControllerClass = (controllerClass: Constructor): void => {
  CONTROLLER_REGISTRY.add(controllerClass);
};
