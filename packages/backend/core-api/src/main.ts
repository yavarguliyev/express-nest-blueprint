import 'reflect-metadata';
import { join } from 'path';
import express, { Request, Response } from 'express';

import {
  ConfigService,
  NestFactory,
  AppName,
  AppRoles,
  getErrorMessage,
  Logger,
  LifecycleService,
  SwaggerModule,
  DocumentBuilder,
  GraphQLApplication,
  MaintenanceMiddleware
} from '@config/libs';
import { AppModule } from '@app.module';
import { SettingsService } from '@modules/settings/settings.service';
import { AuthService } from '@modules/auth/auth.service';

async function bootstrap(): Promise<void> {
  let lifecycleService: LifecycleService | undefined;

  try {
    const app = await NestFactory.create(AppModule, { appName: AppName.MAIN });
    lifecycleService = app.get(LifecycleService);

    const settingsService = app.get(SettingsService);
    const authService = app.get(AuthService);
    const maintenanceMiddleware = app.get(MaintenanceMiddleware);
    const graphqlApp = app.get(GraphQLApplication);

    Logger.setSettingsService(settingsService);
    authService.setSettingsService(settingsService);
    maintenanceMiddleware.setSettingsService(settingsService);

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3000);
    const host = configService.get<string>('HOST', '0.0.0.0');
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    const role = (configService.get<string>('APP_ROLE', AppRoles.API) || '') as AppRoles;
    const adminPath = join(__dirname, `${configService.get<string>('ADMIN_STATIC_PATH')}`);
    const adminBaseUrl = configService.get<string>('ADMIN_BASE_URL', '');
    const uploadsPath = join(__dirname, `${configService.get<string>('UPLOADS_STATIC_PATH')}`);
    const uploadsBaseUrl = join(__dirname, `${configService.get<string>('UPLOADS_BASE_URL')}`);

    if (role === AppRoles.API) {
      if (!isProduction) {
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

      graphqlApp.applyMiddleware(app.getExpressApp(), '/graphql');

      if (!isProduction) {
        graphqlApp.applyGraphiQL(app.getExpressApp(), '/graphiql');
        Logger.log('🔮 GraphQL endpoint enabled at /graphql', 'Bootstrap');
        Logger.log('🎮 GraphiQL playground enabled at /graphiql', 'Bootstrap');
      }

      app.use(adminBaseUrl!, express.static(adminPath));
      app.use(`${adminBaseUrl}/*`, (_req: Request, res: Response) => res.sendFile(join(adminPath, 'index.html')));
      app.use(uploadsBaseUrl, express.static(uploadsPath));

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
