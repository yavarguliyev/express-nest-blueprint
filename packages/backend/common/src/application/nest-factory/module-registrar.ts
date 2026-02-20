import { Container } from '../../core/container/container';
import { MODULE_METADATA } from '../../core/decorators/module.decorator';
import { BadRequestException } from '../../domain/exceptions/http-exceptions';
import { ModuleMetadata, DynamicModule, RegisterOptions } from '../../domain/interfaces/module/module.interface';
import { Constructor, InitializerToken } from '../../domain/types/common/util.type';
import { ObjectProvider, Providers } from '../../domain/types/module/provider.type';

export class ModuleRegistrar {
  getModuleMetadata (moduleOrConfig: Constructor | DynamicModule): ModuleMetadata {
    if (this.isDynamicModule(moduleOrConfig)) {
      return {
        providers: moduleOrConfig.providers ?? [],
        controllers: moduleOrConfig.controllers ?? [],
        exports: moduleOrConfig.exports ?? [],
        imports: moduleOrConfig.imports ?? []
      };
    }

    const metadata = Reflect.getMetadata(MODULE_METADATA as symbol, moduleOrConfig) as ModuleMetadata;
    if (!metadata) throw new BadRequestException(`${moduleOrConfig.name} is not marked as @Module()`);
    return metadata;
  }

  registerProviders (providers: Providers | undefined, container: Container): void {
    providers?.forEach(provider => {
      if (this.isObjectProvider(provider)) {
        container.register({
          provide: provider.provide as InitializerToken | symbol | Constructor<object>,
          useClass: provider.useClass as Constructor<object>,
          useValue: provider.useValue as object,
          useFactory: provider.useFactory as (...args: unknown[]) => object,
          inject: provider.inject as (Constructor | InitializerToken | symbol)[]
        } as RegisterOptions);
      } else {
        container.register({ provide: provider as Constructor });
      }
    });
  }

  registerControllers (controllers: Constructor[] | undefined, container: Container): void {
    controllers?.forEach(controller => container.register({ provide: controller }));
  }

  private isDynamicModule (moduleOrConfig: Constructor | DynamicModule): moduleOrConfig is DynamicModule {
    return typeof moduleOrConfig === 'object' && moduleOrConfig !== null && 'module' in moduleOrConfig;
  }

  private isObjectProvider (provider: unknown): provider is ObjectProvider {
    return typeof provider === 'object' && provider !== null && 'provide' in provider;
  }
}
