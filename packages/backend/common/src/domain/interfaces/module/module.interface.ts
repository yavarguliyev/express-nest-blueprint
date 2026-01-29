import { Constructor } from '../../types/common/util.type';
import { Providers, InjectionToken, ObjectProvider } from '../../types/module/provider.type';

export interface ConfigModuleOptions {
  envFilePath?: string;
  ignoreEnvFile?: boolean;
  isGlobal?: boolean;
}

export interface BaseModuleMetadata {
  controllers?: Constructor[];
  exports?: Array<InjectionToken | DynamicModule | Promise<DynamicModule>>;
  global?: boolean;
  imports?: Array<Constructor | DynamicModule | Promise<DynamicModule>>;
  providers?: Providers;
}

export interface DynamicModule extends BaseModuleMetadata {
  module: Constructor;
}

export type ModuleMetadata = BaseModuleMetadata;

export interface RegisterModuleOptions {
  moduleOrConfig: Constructor | DynamicModule;
}

export type RegisterOptions<T = object> = ObjectProvider<T>;
