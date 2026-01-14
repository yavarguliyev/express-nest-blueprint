import { Module, Inject } from '@common/decorators';
import { LoggerModule } from '@common/logger';
import { LoggerMiddleware } from '@common/middleware';
import { JwtService } from '@common/services';
import { CacheModule } from '@core/cache/cache.module';
import { ComputeModule } from '@core/compute';
import { DatabaseModule } from '@core/database';
import { LifecycleModule } from '@core/lifecycle';
import { RedisModule } from '@core/redis/redis.module';
import { StorageModule } from '@core/storage/storage.module';
import { AuthGuard, RolesGuard, HeaderAuthGuard } from '@common/guards';

@Module({
  imports: [
    LoggerModule.forRoot(),
    LifecycleModule.forRoot(),
    DatabaseModule.forRoot(),
    RedisModule.forRoot(),
    CacheModule.forRoot(),
    ComputeModule.forRoot(),
    StorageModule.forRoot()
  ],
  controllers: [],
  providers: [
    LoggerMiddleware,
    JwtService,
    AuthGuard,
    RolesGuard,
    HeaderAuthGuard,
    {
      provide: 'APP_INITIALIZER',
      useFactory: (async (...initializers: Array<() => Promise<void> | void>): Promise<void> => {
        for (const init of initializers) {
          if (typeof init === 'function') {
            const result = init();
            if (result instanceof Promise) await result;
          }
        }
      }) as (...args: unknown[]) => Promise<void>,
      inject: ['LOGGER_INITIALIZER', 'LIFECYCLE_INITIALIZER', 'DATABASE_INITIALIZER', 'REDIS_INITIALIZER', 'CIRCUIT_BREAKER_INITIALIZER', 'COMPUTE_INITIALIZER', 'CACHE_INITIALIZER']
    }
  ],
  exports: [JwtService]
})
export class SharedModule {
  constructor (@Inject('APP_INITIALIZER') _initializer: unknown) {
    void _initializer;
  }
}
