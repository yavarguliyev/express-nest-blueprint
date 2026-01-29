import { LifecycleModule } from './lifecycle/lifecycle.module';
import { JwtService } from './services/jwt.service';
import { Inject } from '../core/decorators/injectable.decorator';
import { Module } from '../core/decorators/module.decorator';
import { AuthGuard } from '../core/guards/auth.guard';
import { HeaderAuthGuard } from '../core/guards/header-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { HeaderAuthMiddleware } from '../core/middleware/header-auth.middleware';
import { LoggerMiddleware } from '../core/middleware/logger.middleware';
import { MaintenanceMiddleware } from '../core/middleware/maintenance.middleware';
import { CacheModule } from '../infrastructure/cache/cache.module';
import { CircuitBreakerModule } from '../infrastructure/circuit-breaker/circuit-breaker.module';
import { ComputeModule } from '../infrastructure/compute/compute.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { HealthModule } from '../infrastructure/health/health.module';
import { KafkaModule } from '../infrastructure/kafka/kafka.module';
import { LoggerModule } from '../infrastructure/logger/logger.module';
import { MetricsModule } from '../infrastructure/metrics/metrics.module';
import { RedisModule } from '../infrastructure/redis/redis.module';
import { StorageModule } from '../infrastructure/storage/storage.module';
import { ThrottlerModule } from '../infrastructure/throttler/throttler.module';

@Module({
  imports: [
    LoggerModule.forRoot(),
    LifecycleModule.forRoot(),
    DatabaseModule.forRoot(),
    RedisModule.forRoot(),
    CacheModule.forRoot(),
    ComputeModule.forRoot(),
    StorageModule.forRoot(),
    HealthModule,
    ThrottlerModule,
    MetricsModule,
    CircuitBreakerModule,
    KafkaModule.forRoot()
  ],
  controllers: [],
  providers: [
    LoggerMiddleware,
    JwtService,
    AuthGuard,
    RolesGuard,
    HeaderAuthGuard,
    HeaderAuthMiddleware,
    MaintenanceMiddleware,
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
      inject: [
        'LOGGER_INITIALIZER',
        'LIFECYCLE_INITIALIZER',
        'DATABASE_INITIALIZER',
        'REDIS_INITIALIZER',
        'CIRCUIT_BREAKER_INITIALIZER',
        'COMPUTE_INITIALIZER',
        'CACHE_INITIALIZER',
        'GRAPHQL_INITIALIZER',
        'KAFKA_INITIALIZER',
        'KAFKA_SUBSCRIBER_INITIALIZER'
      ]
    }
  ],
  exports: [JwtService]
})
export class SharedModule {
  constructor (@Inject('APP_INITIALIZER') _initializer: unknown) {
    void _initializer;
  }
}
