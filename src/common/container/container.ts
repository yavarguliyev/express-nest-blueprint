import 'reflect-metadata';

import { INJECT_METADATA, INJECTABLE_METADATA } from '@common/decorators';
import { BadRequestException } from '@common/exceptions';
import { RegisterOptions } from '@common/interfaces';
import { Constructor, Provider } from '@common/types';

export class Container {
  private static instance: Container;
  private services = new Map<Constructor | string | symbol, Provider>();
  private singletons = new Map<Constructor | string | symbol, object>();

  static getInstance (): Container {
    if (!Container.instance) Container.instance = new Container();
    return Container.instance;
  }

  has (provide: Constructor | string | symbol): boolean {
    return this.services.has(provide);
  }

  getServices (): Map<Constructor | string | symbol, Provider> {
    return this.services;
  }

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
      this.services.set(provide, { type: 'class', target: provide as Constructor });
    }
  }

  resolve<T extends object> ({ provide }: { provide: Constructor<T> | string | symbol }): T {
    if (this.singletons.has(provide)) return this.singletons.get(provide) as T;

    const entry = this.services.get(provide);
    if (!entry) throw new BadRequestException(`Provider ${String(provide)} not found`);

    let instance: unknown;

    switch (entry.type) {
      case 'value': {
        instance = entry.value;
        break;
      }
      case 'factory': {
        const deps = entry.inject.map((dep) => this.resolve({ provide: dep }));
        instance = entry.factory(...deps);
        break;
      }
      case 'class': {
        const paramTypes = (Reflect.getMetadata('design:paramtypes', entry.target) || []) as Constructor[];
        const injectTokens = (Reflect.getMetadata(INJECT_METADATA, entry.target) || []) as Constructor[];

        const deps2 = paramTypes.map((dep, index) => {
          const customToken = injectTokens[index];
          if (customToken) return this.resolve({ provide: customToken });
          return this.resolve({ provide: dep });
        });

        instance = new (entry.target as unknown as new (...args: unknown[]) => unknown)(...deps2);
        break;
      }
    }

    this.singletons.set(provide, instance as object);
    return instance as T;
  }

  clear (): void {
    this.services.clear();
    this.singletons.clear();
  }
}
