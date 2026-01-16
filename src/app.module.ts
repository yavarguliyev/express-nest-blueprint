import { Module } from '@common/decorators/module.decorator';
import { MiddlewareConsumer } from '@common/interfaces/middleware.interface';
import { NestModule } from '@common/interfaces/common.interface';
import { LoggerMiddleware } from '@common/middleware/logger.middleware';
import { HeaderAuthMiddleware } from '@common/middleware/header-auth.middleware';
import { MetricsMiddleware } from '@common/middleware/metrics.middleware';
import { RateLimitMiddleware } from '@common/middleware/rate-limit.middleware';
import { ConfigModule } from '@core/config/config.module';
import { HealthModule } from '@core/health/health.module';
import { MetricsModule } from '@core/metrics/metrics.module';
import { ThrottlerModule } from '@core/throttler/throttler.module';
import { CircuitBreakerModule } from '@core/circuit-breaker/circuit-breaker.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { AdminModule } from '@modules/admin/admin.module';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env.NODE_ENV?.toLowerCase().startsWith('prod') || false
    }),
    SharedModule,
    HealthModule,
    ThrottlerModule,
    MetricsModule,
    CircuitBreakerModule,
    UsersModule,
    AuthModule,
    AdminModule
  ],
  controllers: [],
  providers: [],
  exports: []
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer): void {
    consumer.apply(MetricsMiddleware, LoggerMiddleware).forRoutes('*');
    consumer.apply(RateLimitMiddleware).exclude('/health*', '/metrics*').forRoutes('*');
    consumer.apply(HeaderAuthMiddleware).forRoutes('*');
  }
}
