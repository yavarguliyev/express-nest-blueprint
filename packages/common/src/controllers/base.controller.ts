import { CONTROLLER_METADATA } from '../decorators/controller.decorator';
import { INJECTABLE_METADATA } from '../decorators/injectable.decorator';
import { registerControllerClass } from '../decorators/register-controller-class.helper';
import { ApiControllerOptions, BaseControllerOptions, ApiVersionConfig } from '../interfaces/common.interface';
import { Constructor } from '../types/common.type';

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

export abstract class BaseController {
  protected readonly apiVersion: string;
  protected readonly apiPrefix: string;
  protected readonly basePath: string;

  constructor (options: BaseControllerOptions) {
    this.apiVersion = options.version || 'v1';
    this.apiPrefix = options.prefix || 'api';
    this.basePath = options.path;
  }

  protected getApiPath (): string {
    return `/${this.apiPrefix}/${this.apiVersion}${this.basePath}`;
  }

  protected getVersionInfo (): ApiVersionConfig {
    return { version: this.apiVersion, prefix: this.apiPrefix };
  }
}
