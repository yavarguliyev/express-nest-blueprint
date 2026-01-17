import { existsSync } from 'fs';
import { join } from 'path';
import 'reflect-metadata';
import express, { Request, Response } from 'express';

import { ConfigService, NestFactory, AppName, AppRoles, getErrorMessage, Logger, LifecycleService, SwaggerModule, DocumentBuilder } from '@config/libs';
import { AppModule } from '@/app.module';

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
      if (process.env['NODE_ENV'] !== 'production') {
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

      const dockerAdminPath = join(__dirname, '../../../../public/admin');
      const localAdminPath = join(__dirname, '../../../../packages/frontend/admin/dist/admin/browser');
      const adminPath = existsSync(dockerAdminPath) ? dockerAdminPath : localAdminPath;

      if (existsSync(adminPath)) {
        const baseUrl = process.env['NODE_ENV'] === 'production' ? '' : '/admin';
        app.use(baseUrl || '/', express.static(adminPath));
        app.use(`${baseUrl}/*`, (_req: Request, res: Response) => res.sendFile(join(adminPath, 'index.html')));
      }

      app.use('/uploads', express.static(join(__dirname, '..', 'public', 'uploads')));

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
