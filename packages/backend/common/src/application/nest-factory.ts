import 'reflect-metadata';

import { NestApplication } from './nest-application';
import { Container } from '../core/container/container';
import { MODULE_METADATA } from '../core/decorators/module.decorator';
import { MiddlewareConsumerImpl } from '../core/middleware/middleware-consumer';
import { AppName } from '../domain/enums/common/common.enum';
import { BadRequestException } from '../domain/exceptions/http-exceptions';
import { NestMiddleware, MiddlewareConfigProxy } from '../domain/interfaces/nest/middleware.interface';
import { RegisterModuleOptions, ModuleMetadata, DynamicModule, RegisterOptions } from '../domain/interfaces/module/module.interface';
import { NestModule } from '../domain/interfaces/nest/nest-core.interface';
import { Constructor, InitializerToken } from '../domain/types/common/util.type';
import { ObjectProvider, Providers } from '../domain/types/module/provider.type';
import { MiddlewareFunction } from '../domain/types/nest/nest-core.type';

export class NestFactory {
  private static readonly apps = new Map<AppName, NestApplication>();

  static async create<T extends object> (moduleClass: Constructor<T>, options?: { appName?: AppName }): Promise<NestApplication> {
    const appName = options?.appName ?? AppName.DEFAULT;

    if (this.apps.has(appName)) return this.apps.get(appName)!;

    const container = Container.getInstance();
    container.register({ provide: Container, useValue: container });
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
    const metadata = this.getModuleMetadata(moduleOrConfig);

    this.registerProviders(metadata.providers, container);
    this.registerControllers(metadata.controllers, container);
    await this.registerImports(metadata.imports, container);
  }

  private getModuleMetadata (moduleOrConfig: Constructor | DynamicModule): ModuleMetadata {
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

  private registerProviders (providers: Providers | undefined, container: Container): void {
    providers?.forEach(provider => {
      if (this.isObjectProvider(provider)) {
        container.register({
          provide: provider.provide as InitializerToken | symbol | Constructor<object>,
          useClass: provider.useClass as Constructor<object>,
          useValue: provider.useValue as object,
          useFactory: provider.useFactory as (...args: unknown[]) => object,
          inject: provider.inject as (Constructor | InitializerToken | symbol)[]
        } as RegisterOptions);
      } else container.register({ provide: provider as Constructor });
    });
  }

  private registerControllers (controllers: Constructor[] | undefined, container: Container): void {
    controllers?.forEach(controller => container.register({ provide: controller }));
  }

  private async registerImports (
    imports: Array<Constructor | DynamicModule | Promise<DynamicModule>> | undefined,
    container: Container
  ): Promise<void> {
    if (!imports) return;
    for (const item of imports) {
      const resolvedItem = item instanceof Promise ? await item : item;
      await this.registerModule({ moduleOrConfig: resolvedItem }, container);
    }
  }

  private async configureModuleMiddleware<T extends object> (moduleClass: Constructor<T>, app: NestApplication, container: Container): Promise<void> {
    const metadata = Reflect.getMetadata(MODULE_METADATA as symbol, moduleClass) as ModuleMetadata;
    if (!metadata) return;

    this.ensureModuleRegistered(moduleClass, container);
    this.configureMiddleware(moduleClass, app, container);
    await this.configureImportMiddleware(metadata.imports, app, container);
  }

  private ensureModuleRegistered (moduleClass: Constructor, container: Container): void {
    if (!container.has(moduleClass)) container.register({ provide: moduleClass, useClass: moduleClass });
  }

  private configureMiddleware (moduleClass: Constructor, app: NestApplication, container: Container): void {
    const instance = container.resolve({ provide: moduleClass });
    if (this.isNestModule(instance)) {
      const consumer = new MiddlewareConsumerImpl(app.getExpressApp(), container);
      this.wrapMiddlewareApply(consumer);
      instance.configure(consumer);
    }
  }

  private wrapMiddlewareApply (consumer: MiddlewareConsumerImpl): void {
    const original = consumer.apply.bind(consumer);
    consumer.apply = (...middleware: (MiddlewareFunction | NestMiddleware)[]): MiddlewareConfigProxy => original(...middleware);
  }

  private async configureImportMiddleware (
    imports: Array<Constructor | DynamicModule | Promise<DynamicModule>> | undefined,
    app: NestApplication,
    container: Container
  ): Promise<void> {
    if (!imports) return;
    for (const item of imports) {
      const resolvedItem = item instanceof Promise ? await item : item;
      const module = this.isDynamicModule(resolvedItem) ? resolvedItem.module : resolvedItem;
      await this.configureModuleMiddleware(module, app, container);
    }
  }

  private isNestModule (instance: unknown): instance is NestModule {
    return (
      typeof instance === 'object' &&
      instance !== null &&
      'configure' in instance &&
      typeof (instance as Record<string, unknown>)['configure'] === 'function'
    );
  }

  private isDynamicModule (moduleOrConfig: Constructor | DynamicModule): moduleOrConfig is DynamicModule {
    return typeof moduleOrConfig === 'object' && moduleOrConfig !== null && 'module' in moduleOrConfig;
  }

  private isObjectProvider (provider: unknown): provider is ObjectProvider {
    return typeof provider === 'object' && provider !== null && 'provide' in provider;
  }
}
