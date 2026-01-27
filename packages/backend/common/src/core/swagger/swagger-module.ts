import * as swaggerUi from 'swagger-ui-express';

import { SwaggerExplorer } from './swagger-explorer';
import { NestApplication } from '../../application/nest-application';
import { OpenAPIObject, SwaggerConfig } from '../../domain/interfaces/swagger-config.interface';

export class SwaggerModule {
  static createDocument (app: NestApplication, config: SwaggerConfig): OpenAPIObject {
    const explorer = new SwaggerExplorer();
    void app;

    return explorer.explore(config);
  }

  static setup (path: string, app: NestApplication, document: OpenAPIObject): void {
    const expressApp = app.getExpressApp();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    expressApp.use(normalizedPath, swaggerUi.serve);
    expressApp.get(
      normalizedPath,
      (req, res, next) => {
        if (req.originalUrl === normalizedPath) return res.redirect(301, `${normalizedPath}/`);
        next();
      },
      swaggerUi.setup(document)
    );

    expressApp.get(`${normalizedPath}/`, swaggerUi.setup(document));
  }
}
