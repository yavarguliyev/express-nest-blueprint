import 'reflect-metadata';

import { NestApplication } from '@common/application';
import { Container } from '@common/container';
import { MODULE_METADATA } from '@common/decorators';
import { AppName } from '@common/enums';
import { BadRequestException } from '@common/exceptions';
import { DynamicModule, ModuleMetadata, RegisterModuleOptions, NestModule, RegisterOptions } from '@common/interfaces';
import { MiddlewareConsumerImpl } from '@common/middleware';
import { Constructor, InitializerToken, ObjectProvider } from '@common/types';

export class NestFactory {
  private static readonly apps = new Map<AppName, NestApplication>();

  static async create<T extends object> (moduleClass: Constructor<T>, options?: { appName?: AppName }): Promise<NestApplication> {
    const appName = options?.appName ?? AppName.DEFAULT;

    if (this.apps.has(appName)) return this.apps.get(appName)!;

    const container = Container.getInstance();
    const factory = new NestFactory();

    await factory.registerModule({ moduleOrConfig: moduleClass }, container);
    const app = new NestApplication(container);
    await factory.configureModuleMiddleware(moduleClass, app, container);
    
    app.init();

    if (container.has('APP_INITIALIZER')) {
      const initializer = container.resolve<Promise<void>>({ provide: 'APP_INITIALIZER' });
      await initializer;
    }

    this.apps.set(appName, app);

    return app;
  }

  static async close (appName?: AppName): Promise<void> {
    if (appName) {
      const app = this.apps.get(appName);
      if (!app) throw new BadRequestException(`App ${appName} is not initialized`);
      await app.close();
      this.apps.delete(appName);
      return;
    }

    for (const [name, app] of this.apps.entries()) {
      await app.close();
      this.apps.delete(name);
    }
  }

  private async registerModule (options: RegisterModuleOptions, container: Container): Promise<void> {
    const { moduleOrConfig } = options;

    let moduleClass: Constructor;
    let moduleMetadata: ModuleMetadata;

    if (this.isDynamicModule(moduleOrConfig)) {
      const dynamicModule = moduleOrConfig;

      const providers = dynamicModule.providers ?? [];
      const controllers = dynamicModule.controllers ?? [];
      const exports = dynamicModule.exports ?? [];
      const imports = dynamicModule.imports ?? [];

      moduleMetadata = { providers, controllers, exports, imports };
    } else {
      moduleClass = moduleOrConfig;
      moduleMetadata = Reflect.getMetadata(MODULE_METADATA as symbol, moduleClass) as ModuleMetadata;

      if (!moduleMetadata) throw new BadRequestException(`${moduleClass.name} is not marked as @Module()`);
    }

    if (moduleMetadata.providers) {
      moduleMetadata.providers.forEach((provider) => {
        if (this.isObjectProvider(provider)) {
          const registerOptions: ObjectProvider = { provide: provider.provide as InitializerToken | symbol | Constructor<object> };

          if (provider.useClass) registerOptions.useClass = provider.useClass as Constructor<object>;
          if (provider.useValue) registerOptions.useValue = provider.useValue as object;
          if (provider.useFactory) registerOptions.useFactory = provider.useFactory as (...args: unknown[]) => object;
          if (provider.inject) registerOptions.inject = provider.inject as (Constructor | InitializerToken | symbol)[];

          container.register(registerOptions as RegisterOptions);
        } else container.register({ provide: provider as Constructor });
      });
    }

    if (moduleMetadata.controllers) moduleMetadata.controllers.forEach((controller) => container.register({ provide: controller }));

    if (moduleMetadata.imports) {
      for (const importedModule of moduleMetadata.imports) {
        await this.registerModule({ moduleOrConfig: importedModule as Constructor | DynamicModule }, container);
      }
    }
  }

  private async configureModuleMiddleware<T extends object> (moduleClass: Constructor<T>, app: NestApplication, container: Container): Promise<void> {
    const moduleMetadata = Reflect.getMetadata(MODULE_METADATA as symbol, moduleClass) as ModuleMetadata;

    if (!moduleMetadata) return;
    if (!container.has(moduleClass)) container.register({ provide: moduleClass, useClass: moduleClass });

    const moduleInstance = container.resolve({ provide: moduleClass });

    if (this.isNestModule(moduleInstance)) {
      const middlewareConsumer = new MiddlewareConsumerImpl(app.getExpressApp(), container);
      const originalApply = middlewareConsumer.apply.bind(middlewareConsumer);

      middlewareConsumer.apply = (...middleware) => {
        const proxy = originalApply(...middleware);
        return proxy;
      };

      moduleInstance.configure(middlewareConsumer);
    }

    if (moduleMetadata.imports) {
      for (const importedModule of moduleMetadata.imports) {
        if (this.isDynamicModule(importedModule as Constructor | DynamicModule)) await this.configureModuleMiddleware((importedModule as DynamicModule).module, app, container);
        else await this.configureModuleMiddleware(importedModule as Constructor, app, container);
      }
    }
  }

  private isNestModule (instance: unknown): instance is NestModule {
    return typeof instance === 'object' && instance !== null && 'configure' in instance && typeof (instance as Record<string, unknown>)['configure'] === 'function';
  }

  private isDynamicModule (moduleOrConfig: Constructor | DynamicModule): moduleOrConfig is DynamicModule {
    return typeof moduleOrConfig === 'object' && moduleOrConfig !== null && 'module' in moduleOrConfig;
  }

  private isObjectProvider (provider: unknown): provider is import('@common/types').ObjectProvider {
    return typeof provider === 'object' && provider !== null && 'provide' in provider;
  }
}
