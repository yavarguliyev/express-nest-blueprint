import 'reflect-metadata';

import { ConfigService } from '@core/config';
import { NestFactory } from '@common/application';
import { AppName, AppRoles } from '@common/enums';
import { getErrorMessage } from '@common/helpers';
import { Logger } from '@common/logger';
import { LifecycleService } from '@core/lifecycle';
import { AppModule } from '@app/common';
import { SwaggerModule, DocumentBuilder } from '@common/swagger';

async function bootstrap (): Promise<void> {
  let lifecycleService: LifecycleService | undefined;

  try {
    const app = await NestFactory.create(AppModule, { appName: AppName.MAIN });
    lifecycleService = app.get(LifecycleService);

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3000);
    const host = configService.get<string>('HOST', '0.0.0.0');
    const role = (configService.get<string>('APP_ROLE', AppRoles.API) || '') as AppRoles;

    if (role === AppRoles.API) {
      if (configService.get<string>('NODE_ENV') !== 'production') {
        const swaggerConfig = new DocumentBuilder()
          .setTitle('Express Nest Blueprint API')
          .setDescription('The API description for the Express Nest Blueprint project')
          .setVersion('1.0')
          .addApiKey({ type: 'apiKey', name: 'X-Health-Key', in: 'header' }, 'health-key')
          .build();

        const document = SwaggerModule.createDocument(app, swaggerConfig);
        SwaggerModule.setup('api', app, document);
        Logger.log('📖 Swagger documentation enabled at /api', 'Bootstrap');
      }

      const server = await app.listen(port, host);

      lifecycleService.setHttpServer(server);
      lifecycleService.startWorkers();

      Logger.log(`🚀 API Server running on http://${host}:${port}`, 'Bootstrap');
    } else if (role === AppRoles.WORKER) {
      lifecycleService.startWorkers();
      Logger.log('💪 Background Worker started', 'Bootstrap');
    } else {
      await app.listen(port, host);
    }
  } catch (error) {
    Logger.error(`Failed to start application: ${getErrorMessage(error)}`, 'Bootstrap');

    if (lifecycleService) await lifecycleService.executeGracefulShutdown();
    else process.exit(1);
  }
}

bootstrap().catch(() => process.exit(1));
