import { Module, MiddlewareConsumer, NestModule, LoggerMiddleware, HeaderAuthMiddleware, MetricsMiddleware, RateLimitMiddleware, ConfigModule, SharedModule, DatabaseModule, GraphQLModule } from '@config/libs';

import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { AdminModule } from '@modules/admin/admin.module';
import { ThemesModule } from '@modules/themes/themes.module';
import { UsersResolver } from '@modules/users/users.resolver';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env['NODE_ENV']?.toLowerCase().startsWith('prod') || false
    }),
    DatabaseModule.forRoot(),
    SharedModule,
    NotificationsModule,
    GraphQLModule.forRoot({ resolvers: [UsersResolver] }),
    UsersModule,
    AuthModule,
    AdminModule,
    ThemesModule
  ],
  controllers: [],
  providers: [],
  exports: []
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer): void {
    consumer.apply(MetricsMiddleware, LoggerMiddleware).forRoutes('*');
    consumer.apply(RateLimitMiddleware).exclude('/health*', '/metrics*', '/api/v1/notifications/stream').forRoutes('*');
    consumer.apply(HeaderAuthMiddleware).forRoutes('*');
  }
}
