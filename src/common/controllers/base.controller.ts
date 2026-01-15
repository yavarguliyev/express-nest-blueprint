import { CONTROLLER_METADATA, INJECTABLE_METADATA } from '@common/decorators';
import { registerControllerClass } from '@common/helpers';
import { ApiControllerOptions, BaseControllerOptions, ApiVersionConfig } from '@common/interfaces';
import { Constructor } from '@common/types';

export function ApiController ({ path, version, prefix }: ApiControllerOptions): ClassDecorator {
  const apiVersion = version ?? 'v1';
  const apiPrefix = prefix ?? 'api';
  const fullPath = `/${apiPrefix}/${apiVersion}${path}`;

  return function (target: object): void {
    Reflect.defineMetadata('api:version', apiVersion, target);
    Reflect.defineMetadata('api:prefix', apiPrefix, target);
    Reflect.defineMetadata('api:basePath', path, target);
    Reflect.defineMetadata(CONTROLLER_METADATA, { path: fullPath }, target);
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target);

    registerControllerClass(target as unknown as Constructor);
  };
}

export function getApiVersion<T> (controllerClass: Constructor<T>): string {
  return (Reflect.getMetadata('api:version', controllerClass) || 'v1') as string;
}

export function getApiPrefix<T> (controllerClass: Constructor<T>): string {
  return (Reflect.getMetadata('api:prefix', controllerClass) || 'api') as string;
}

export function getBasePath<T> (controllerClass: Constructor<T>): string {
  return (Reflect.getMetadata('api:basePath', controllerClass) || '') as string;
}

export function getFullApiPath<T> (controllerClass: Constructor<T>): string {
  const version = getApiVersion(controllerClass);
  const prefix = getApiPrefix(controllerClass);
  const basePath = getBasePath(controllerClass);

  return `/${prefix}/${version}${basePath}`;
}

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
