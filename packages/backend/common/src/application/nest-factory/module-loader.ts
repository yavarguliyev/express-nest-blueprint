import { Container } from '../../core/container/container';
import { RegisterModuleOptions } from '../../domain/interfaces/module/module.interface';
import { Constructor } from '../../domain/types/common/util.type';
import { NestApplication } from '../nest-application';
import { ModuleRegistrar } from './module-registrar';
import { MiddlewareConfigurator } from './middleware-configurator';
import { BaseModuleContext } from '../../domain/interfaces/nest/nest-core.interface';

export class ModuleLoader {
  private registrar = new ModuleRegistrar();
  private middlewareConfigurator = new MiddlewareConfigurator();

  async registerModule (options: RegisterModuleOptions, container: Container): Promise<void> {
    const { moduleOrConfig } = options;
    const metadata = this.registrar.getModuleMetadata(moduleOrConfig);

    this.registrar.registerProviders(metadata.providers, container);
    this.registrar.registerControllers(metadata.controllers, container);
    await this.registerImports({ imports: metadata.imports, container });
  }

  async configureModuleMiddleware<T extends object> (moduleClass: Constructor<T>, app: NestApplication, container: Container): Promise<void> {
    await this.middlewareConfigurator.configureModuleMiddleware(moduleClass, app, container);
  }

  private async registerImports (opts: BaseModuleContext): Promise<void> {
    const { imports, container } = opts;
    if (!imports) return;
    for (const item of imports) {
      const resolvedItem = item instanceof Promise ? await item : item;
      await this.registerModule({ moduleOrConfig: resolvedItem }, container);
    }
  }
}
