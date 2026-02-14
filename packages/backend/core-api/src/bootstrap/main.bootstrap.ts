import { NestApplication, BaseBootstrap, AppName } from '@config/libs';
import { AppModule } from '@app.module';
import { join } from 'path';
import { ServiceLinker } from './service-linker';

export class AppBootstrap extends BaseBootstrap {
  constructor () {
    super(AppModule, {
      appName: AppName.MAIN,
      portEnvVar: 'PORT',
      defaultPort: 3000,
      rootDir: join(__dirname, '..')
    });
  }

  protected onBindDependencies (app: NestApplication): void {
    ServiceLinker.link(app);
  }
}
