import { NestApplication } from '../nest-application';
import { Container } from '../../core/container/container';
import { MODULE_METADATA } from '../../core/decorators/module.decorator';
import { MiddlewareConsumerImpl } from '../../core/middleware/middleware-consumer';
import { Constructor } from '../../domain/types/common/util.type';
import { MiddlewareFunction } from '../../domain/types/nest/nest-core.type';
import { NestMiddleware, MiddlewareConfigProxy } from '../../domain/interfaces/nest/middleware.interface';
import { ModuleMetadata, DynamicModule } from '../../domain/interfaces/module/module.interface';
import { ModuleBootstrapContext, NestModule } from '../../domain/interfaces/nest/nest-core.interface';

export class MiddlewareConfigurator {
  async configureModuleMiddleware<T extends object> (moduleClass: Constructor<T>, app: NestApplication, container: Container): Promise<void> {
    const metadata = Reflect.getMetadata(MODULE_METADATA as symbol, moduleClass) as ModuleMetadata;
    if (!metadata) return;
    this.ensureModuleRegistered(moduleClass, container);
    this.configureMiddleware(moduleClass, app, container);
    await this.configureImportMiddleware({ imports: metadata.imports, app, container });
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

  private async configureImportMiddleware (opts: ModuleBootstrapContext): Promise<void> {
    const { imports, app, container } = opts;

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
}
