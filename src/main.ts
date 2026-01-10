import 'reflect-metadata';
import { config } from 'dotenv';
config();

import { NestFactory } from '@common/application';
import { AppName, AppRoles } from '@common/enums';
import { getErrorMessage } from '@common/helpers';
import { Logger } from '@common/logger';
import { LifecycleService } from '@core/lifecycle';
import { AppModule } from '@app/common';

async function bootstrap (): Promise<void> {
  try {
    const app = await NestFactory.create(AppModule, { appName: AppName.MAIN });
    const lifecycleService = app.get(LifecycleService);
    const role = (process.env['APP_ROLE'] || AppRoles.API) as AppRoles;

    if (role !== AppRoles.WORKER) {
      const port = parseInt(process.env.PORT || '3000', 10);
      const server = await app.listen(port);
      lifecycleService.setHttpServer(server);
      Logger.log(`🚀 API Server running on http://localhost:${port}`, 'Bootstrap');
    } else {
      Logger.log('💪 Background Worker started', 'Bootstrap');
    }
  } catch (error) {
    Logger.error(`Failed to start application: ${getErrorMessage(error)}`, 'Bootstrap');
    process.exit(1);
  }
}

bootstrap().catch(() => process.exit(1));
