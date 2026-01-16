import { existsSync } from 'fs';
import { join } from 'path';
import 'reflect-metadata';
import express from 'express';

import { ConfigService } from '@core/config/config.service';
import { NestFactory } from '@common/application/nest-factory';
import { AppName, AppRoles } from '@common/enums/common.enum';
import { getErrorMessage } from '@common/helpers/utility-functions.helper';
import { Logger } from '@common/logger/logger.service';
import { LifecycleService } from '@core/lifecycle/lifecycle.service';
import { AppModule } from '@app/common';
import { SwaggerModule } from '@common/swagger/swagger-module';
import { DocumentBuilder } from '@common/swagger/document-builder';

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

      const publicAdminPath = join(__dirname, '..', 'public', 'admin');
      const localAdminPath = join(__dirname, '..', 'admin', 'dist', 'admin', 'browser');
      const adminPath = existsSync(publicAdminPath) ? publicAdminPath : localAdminPath;
      const uploadsPath = join(__dirname, '..', 'public', 'uploads');

      app.use('/uploads', express.static(uploadsPath));
      
      if (process.env.NODE_ENV === 'production') {
        app.use('/', express.static(adminPath));
        app.use('/*', (_req, res) => res.sendFile(join(adminPath, 'index.html')));
      } else {
        app.use('/admin', express.static(adminPath));
        app.use('/admin/*', (_req, res) => res.sendFile(join(adminPath, 'index.html')));
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
