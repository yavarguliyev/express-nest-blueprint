import { Inject } from './decorators/injectable.decorator';
import { Module } from './decorators/module.decorator';
import { LoggerModule } from './logger/logger.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { JwtService } from './services/jwt.service';
import { CacheModule } from './cache/cache.module';
import { ComputeModule } from './compute/compute.module';
import { DatabaseModule } from './database/database.module';
import { LifecycleModule } from './lifecycle/lifecycle.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { HeaderAuthGuard } from './guards/header-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { HeaderAuthMiddleware } from './middleware/header-auth.middleware';

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
