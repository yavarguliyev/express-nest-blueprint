import { Module, Inject } from '@common/decorators';
import { AppRoles } from '@common/enums';
import { LoggerModule } from '@common/logger';
import { LoggerMiddleware } from '@common/middleware';
import { JwtService } from '@common/services';
import { ComputeModule } from '@core/compute';
import { computeConfig } from '@core/config';
import { DatabaseModule } from '@core/database';
import { LifecycleModule } from '@core/lifecycle';

@Module({
  imports: [
    LoggerModule.forRoot(),
    LifecycleModule.forRoot(),
    DatabaseModule.forRoot(),
    ComputeModule.forRoot({
      enableWorker: computeConfig.COMPUTE_APP_ROLE === AppRoles.WORKER || !computeConfig.COMPUTE_APP_ROLE,
      enableApi: computeConfig.COMPUTE_APP_ROLE !== AppRoles.WORKER,
      autoSpawn: computeConfig.COMPUTE_AUTO_SPAWN,
      workerMinCount: computeConfig.COMPUTE_MIN_WORKERS,
      workerMaxCount: computeConfig.COMPUTE_MAX_WORKERS
    })
  ],
  controllers: [],
  providers: [
    LoggerMiddleware,
    JwtService,
    {
      provide: 'APP_INITIALIZER',
      useFactory: (async (...initializers: Array<() => Promise<void>>): Promise<void> => {
        for (const init of initializers) {
          if (typeof init === 'function') await init();
        }
      }) as (...args: unknown[]) => Promise<void>,
      inject: ['LOGGER_INITIALIZER', 'LIFECYCLE_INITIALIZER', 'DATABASE_INITIALIZER', 'COMPUTE_INITIALIZER']
    }
  ],
  exports: [JwtService]
})
export class SharedModule {
  constructor (@Inject('APP_INITIALIZER') _initializer: unknown) {
    void _initializer;
  }
}
