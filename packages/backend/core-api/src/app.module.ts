import { Module, MiddlewareConsumer, NestModule, LoggerMiddleware, HeaderAuthMiddleware, MetricsMiddleware, RateLimitMiddleware, ConfigModule, HealthModule, MetricsModule, ThrottlerModule, CircuitBreakerModule, SharedModule, DatabaseModule } from '@config/libs';

import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { AdminModule } from '@/modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env['NODE_ENV']?.toLowerCase().startsWith('prod') || false
    }),
    DatabaseModule.forRoot(),
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
