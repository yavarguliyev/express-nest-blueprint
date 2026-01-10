import { Constructor } from '@common/types';

export const CONTROLLER_REGISTRY = new Set<Constructor>();

export function registerControllerClass (controllerClass: Constructor): void {
  CONTROLLER_REGISTRY.add(controllerClass);
}
