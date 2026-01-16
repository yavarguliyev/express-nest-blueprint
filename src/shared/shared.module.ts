import { Inject } from '@common/decorators/injectable.decorator';
import { Module } from '@common/decorators/module.decorator';
import { LoggerModule } from '@common/logger/logger.module';
import { LoggerMiddleware } from '@common/middleware/logger.middleware';
import { JwtService } from '@common/services/jwt.service';
import { CacheModule } from '@core/cache/cache.module';
import { ComputeModule } from '@core/compute/compute.module';
import { DatabaseModule } from '@core/database/database.module';
import { LifecycleModule } from '@core/lifecycle/lifecycle.module';
import { RedisModule } from '@core/redis/redis.module';
import { StorageModule } from '@core/storage/storage.module';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { HeaderAuthGuard } from '@common/guards/header-auth.guard';
import { AdminGuard } from '@common/guards/admin.guard';
import { HeaderAuthMiddleware } from '@common/middleware/header-auth.middleware';

@Module({
  imports: [LoggerModule.forRoot(), LifecycleModule.forRoot(), DatabaseModule.forRoot(), RedisModule.forRoot(), CacheModule.forRoot(), ComputeModule.forRoot(), StorageModule.forRoot()],
  controllers: [],
  providers: [
    LoggerMiddleware,
    JwtService,
    AdminGuard,
    AuthGuard,
    RolesGuard,
    HeaderAuthGuard,
    HeaderAuthMiddleware,
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
