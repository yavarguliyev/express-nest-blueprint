import 'reflect-metadata';

import { NestApplication } from './nest-application';
import { Container } from '../core/container/container';
import { AppName } from '../domain/enums/common/common.enum';
import { BadRequestException } from '../domain/exceptions/http-exceptions';
import { Constructor } from '../domain/types/common/util.type';
import { AppInitializer } from './nest-factory/app-initializer';
import { ModuleLoader } from './nest-factory/module-loader';

export class NestFactory {
  private static readonly apps = new Map<AppName, NestApplication>();

  static async create<T extends object> (moduleClass: Constructor<T>, options?: { appName?: AppName }): Promise<NestApplication> {
    const appName = options?.appName ?? AppName.DEFAULT;

    if (this.apps.has(appName)) return this.apps.get(appName)!;

    const container = Container.getInstance();
    container.register({ provide: Container, useValue: container });

    const moduleLoader = new ModuleLoader();
    await moduleLoader.registerModule({ moduleOrConfig: moduleClass }, container);

    const app = new NestApplication(container);
    await moduleLoader.configureModuleMiddleware(moduleClass, app, container);

    const appInitializer = new AppInitializer();
    await appInitializer.initialize(app, container);

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
}
