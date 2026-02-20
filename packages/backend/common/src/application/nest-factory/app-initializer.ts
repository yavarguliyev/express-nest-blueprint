import { NestApplication } from '../nest-application';
import { Container } from '../../core/container/container';

export class AppInitializer {
  async initialize (app: NestApplication, container: Container): Promise<void> {
    app.init();

    if (container.has('APP_INITIALIZER')) {
      const initializer = container.resolve<Promise<void>>({ provide: 'APP_INITIALIZER' });
      await initializer;
    }
  }
}
