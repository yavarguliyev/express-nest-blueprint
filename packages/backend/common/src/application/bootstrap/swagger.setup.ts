import { NestApplication } from '../nest-application';
import { DocumentBuilder } from '../../core/swagger/document-builder';
import { SwaggerModule } from '../../core/swagger/swagger-module';
import { ConfigService } from '../../infrastructure/config/config.service';
import { Logger } from '../../infrastructure/logger/logger.service';

export class SwaggerSetup {
  static setup (app: NestApplication): void {
    const configService = app.get(ConfigService);
    const isProduction = configService.get<string>('NODE_ENV') === 'production';

    if (isProduction) return;

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Backend API Documentation')
      .setDescription('The API description for the project')
      .setVersion('1.0')
      .addApiKey({ type: 'apiKey', name: 'X-Health-Key', in: 'header' }, 'health-key')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api', app, document);
    Logger.log('📖 Swagger documentation enabled at /api', 'SwaggerSetup');
  }
}
