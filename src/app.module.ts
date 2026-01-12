import { Module } from '@common/decorators';
import { MiddlewareConsumer, NestModule } from '@common/interfaces';
import { LoggerMiddleware } from '@common/middleware';
import { ConfigModule } from '@core/config';
import { HealthModule } from '@core/health';
import { MetricsModule, MetricsMiddleware } from '@core/metrics';
import { ThrottlerModule, RateLimitMiddleware } from '@core/throttler';
import { CircuitBreakerModule } from '@core/circuit-breaker/circuit-breaker.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    SharedModule,
    HealthModule,
    ThrottlerModule,
    MetricsModule,
    CircuitBreakerModule,
    UsersModule,
    AuthModule
  ],
  controllers: [],
  providers: [],
  exports: []
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer): void {
    consumer.apply(MetricsMiddleware, LoggerMiddleware, RateLimitMiddleware).forRoutes('*');
  }
}
