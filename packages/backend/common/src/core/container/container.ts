import { INJECTABLE_METADATA } from '../decorators/injectable.decorator';
import { providerResolvers } from '../../domain/constants/module/module.const';
import { BadRequestException } from '../../domain/exceptions/http-exceptions';
import { RegisterOptions } from '../../domain/interfaces/module/module.interface';
import { Constructor } from '../../domain/types/common/util.type';
import { Provider, InjectionToken } from '../../domain/types/module/provider.type';

export class Container {
  private static instance: Container;
  private services = new Map<InjectionToken, Provider>();
  private singletons = new Map<InjectionToken, object>();

  static getInstance (): Container {
    if (!Container.instance) Container.instance = new Container();
    return Container.instance;
  }

  has = (provide: InjectionToken): boolean => this.services.has(provide);
  getServices = (): Map<InjectionToken, Provider> => this.services;

  register<T extends object> (options: RegisterOptions<T>): void {
    const { provide, useClass, useValue, useFactory, inject = [] } = options;

    if (useClass) {
      const target = useClass;
      if (!Reflect.getMetadata(INJECTABLE_METADATA, target)) throw new BadRequestException(`${target.name} is not marked as @Injectable()`);
      this.services.set(provide, { type: 'class', target });
    } else if (useValue) {
      this.services.set(provide, { type: 'value', value: useValue });
    } else if (useFactory) {
      this.services.set(provide, { type: 'factory', factory: useFactory, inject });
    } else {
      if (!Reflect.getMetadata(INJECTABLE_METADATA, provide)) throw new BadRequestException(`${String(provide)} is not marked as @Injectable()`);
      this.services.set(provide, { type: 'class', target: provide as Constructor<object> });
    }
  }

  resolve<T = unknown> ({ provide }: { provide: InjectionToken<T> }): T {
    if (this.singletons.has(provide)) return this.singletons.get(provide) as T;

    const entry = this.services.get(provide);
    if (!entry) throw new BadRequestException(`Provider ${String(provide)} not found`);

    const resolver = providerResolvers[entry.type];
    if (!resolver) throw new BadRequestException(`Unknown provider type: ${entry.type}`);

    const instance = resolver(entry, this);
    this.singletons.set(provide, instance as object);

    return instance as T;
  }

  clear (): void {
    this.services.clear();
    this.singletons.clear();
  }
}
