import 'reflect-metadata';
import { config } from 'dotenv';
config();

import { ConfigService } from '@core/config';
import { NestFactory } from '@common/application';
import { AppName, AppRoles } from '@common/enums';
import { getErrorMessage } from '@common/helpers';
import { Logger } from '@common/logger';
import { LifecycleService } from '@core/lifecycle';
import { AppModule } from '@app/common';

async function bootstrap (): Promise<void> {
  let lifecycleService: LifecycleService | undefined;

  try {
    const app = await NestFactory.create(AppModule, { appName: AppName.MAIN });
    lifecycleService = app.get(LifecycleService);
    const configService = app.get(ConfigService);

    const role = configService.get<string>('APP_ROLE', AppRoles.API) as AppRoles;

    if (role !== AppRoles.WORKER) {
      const port = configService.get<number>('PORT', 3000);
      const host = configService.get<string>('HOST', '0.0.0.0');

      const server = await app.listen(port, host);
      lifecycleService.setHttpServer(server);
      lifecycleService.startWorkers();

      Logger.log(`🚀 API Server running on http://${host}:${port}`, 'Bootstrap');
    } else Logger.log('💪 Background Worker started', 'Bootstrap');
  } catch (error) {
    Logger.error(`Failed to start application: ${getErrorMessage(error)}`, 'Bootstrap');

    if (lifecycleService) await lifecycleService.executeGracefulShutdown();
    else process.exit(1);
  }
}

bootstrap().catch(() => process.exit(1));
