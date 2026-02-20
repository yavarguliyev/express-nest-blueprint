import { ApiControllerOptions } from 'domain/types/api/api-http.type';
import { Constructor } from '../../types/common/util.type';
import { CONTROLLER_METADATA } from '../../../core/decorators/controller.decorator';
import { INJECTABLE_METADATA } from '../../../core/decorators/injectable.decorator';
import { registerControllerClass } from '../../../core/decorators/register-controller-class.decorator';

export const ApiController = ({ path, version, prefix }: ApiControllerOptions): ClassDecorator => {
  const apiVersion = version ?? 'v1';
  const apiPrefix = prefix ?? 'api';
  const fullPath = `/${apiPrefix}/${apiVersion}${path}`;

  return (target: object): void => {
    Reflect.defineMetadata('api:version', apiVersion, target);
    Reflect.defineMetadata('api:prefix', apiPrefix, target);
    Reflect.defineMetadata('api:basePath', path, target);
    Reflect.defineMetadata(CONTROLLER_METADATA, { path: fullPath }, target);
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target);

    registerControllerClass(target as unknown as Constructor);
  };
};

export const getApiVersion = <T>(controllerClass: Constructor<T>): string => (Reflect.getMetadata('api:version', controllerClass) || 'v1') as string;
export const getApiPrefix = <T>(controllerClass: Constructor<T>): string => (Reflect.getMetadata('api:prefix', controllerClass) || 'api') as string;
export const getBasePath = <T>(controllerClass: Constructor<T>): string => (Reflect.getMetadata('api:basePath', controllerClass) || '') as string;

export const getFullApiPath = <T>(controllerClass: Constructor<T>): string => {
  const version = getApiVersion(controllerClass);
  const prefix = getApiPrefix(controllerClass);
  const basePath = getBasePath(controllerClass);

  return `/${prefix}/${version}${basePath}`;
};

export const METHODS = ['get', 'post', 'put', 'delete', 'patch', 'use'] as const;
