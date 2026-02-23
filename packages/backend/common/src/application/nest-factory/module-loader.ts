import { MiddlewareConfigurator } from './middleware-configurator';
import { ModuleRegistrar } from './module-registrar';
import { NestApplication } from '../nest-application';
import { Container } from '../../core/container/container';
import { BaseModuleContext } from '../../domain/interfaces/nest/nest-core.interface';
import { Constructor } from '../../domain/types/common/util.type';
import { RegisterModuleOptions } from '../../domain/interfaces/module/module.interface';

export class ModuleLoader {
  private registrar = new ModuleRegistrar();
  private middlewareConfigurator = new MiddlewareConfigurator();

  async registerModule(options: RegisterModuleOptions, container: Container): Promise<void> {
    const metadata = this.registrar.getModuleMetadata(options.moduleOrConfig);

    this.registrar.registerProviders(metadata.providers, container);
    this.registrar.registerControllers(metadata.controllers, container);

    await this.registerImports({ imports: metadata.imports, container });
  }

  async configureModuleMiddleware<T extends object>(moduleClass: Constructor<T>, app: NestApplication, container: Container): Promise<void> {
    await this.middlewareConfigurator.configureModuleMiddleware(moduleClass, app, container);
  }

  private async registerImports(opts: BaseModuleContext): Promise<void> {
    const { imports, container } = opts;

    if (!imports) return;
    for (const item of imports) {
      const resolvedItem = item instanceof Promise ? await item : item;
      await this.registerModule({ moduleOrConfig: resolvedItem }, container);
    }
  }
}
