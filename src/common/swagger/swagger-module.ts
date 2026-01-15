
import * as swaggerUi from 'swagger-ui-express';
import { NestApplication } from '@common/application';
import { OpenAPIObject, SwaggerConfig } from './interfaces/swagger-config.interface';
import { SwaggerExplorer } from './swagger-explorer';

export class SwaggerModule {
  static createDocument (app: NestApplication, config: SwaggerConfig): OpenAPIObject {
    const explorer = new SwaggerExplorer();
    // app parameter is included to match NestJS signature, though in this simple version
    // we use the global CONTROLLER_REGISTRY for exploration.
    void app;
    return explorer.explore(config);
  }

  static setup (path: string, app: NestApplication, document: OpenAPIObject): void {
    const expressApp = app.getExpressApp();
    expressApp.use(path, swaggerUi.serve, swaggerUi.setup(document));
  }
}
