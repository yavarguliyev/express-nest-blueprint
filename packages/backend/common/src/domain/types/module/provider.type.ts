import { Constructor, AbstractConstructor } from '../common/util.type';
import type { Container } from '../../../core/container/container';

export type InjectionToken<T = unknown> = Constructor<T> | AbstractConstructor<T> | string | symbol;

export type ClassProvider<T = object> = { type: 'class'; target: Constructor<T> };

export type ValueProvider<T = object> = { type: 'value'; value: T };

export type FactoryProvider<T = object> = {
  type: 'factory';
  factory: (...args: unknown[]) => T;
  inject: InjectionToken[];
};

export type ProviderType = 'value' | 'factory' | 'class';

export type Provider<T = object> = ClassProvider<T> | FactoryProvider<T> | ValueProvider<T>;

export type ObjectProvider<T = unknown> = {
  inject?: InjectionToken[];
  provide: InjectionToken<T>;
  useClass?: Constructor<T>;
  useFactory?: (...args: unknown[]) => T;
  useValue?: T;
};

export type ProviderOptions<T = unknown> = Constructor<T> | ObjectProvider<T>;

export type ProviderResolver = (entry: Provider, container: Container) => unknown;

export type Providers = Array<ProviderOptions>;
