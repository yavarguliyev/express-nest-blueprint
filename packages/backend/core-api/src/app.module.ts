import {
  Module,
  MiddlewareConsumer,
  NestModule,
  LoggerMiddleware,
  HeaderAuthMiddleware,
  MetricsMiddleware,
  RateLimitMiddleware,
  MaintenanceMiddleware,
  ConfigModule,
  SharedModule,
  DatabaseModule,
  GraphQLModule
} from '@config/libs';

import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { AdminModule } from '@modules/admin/admin.module';
import { ThemesModule } from '@modules/themes/themes.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { UsersResolver } from '@modules/users/users.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env['NODE_ENV']?.toLowerCase().startsWith('prod') || false
    }),
    DatabaseModule.forRoot(),
    SharedModule,
    GraphQLModule.forRoot({ resolvers: [UsersResolver] }),
    UsersModule,
    AuthModule,
    AdminModule,
    ThemesModule,
    SettingsModule
  ],
  controllers: [],
  providers: [],
  exports: []
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer): void {
    consumer.apply(MetricsMiddleware, LoggerMiddleware).forRoutes('*');
    consumer.apply(MaintenanceMiddleware).forRoutes('*');
    consumer.apply(RateLimitMiddleware).exclude('/api/v1/health*', '/api/v1/metrics*', '/api/v1/settings', '/api/v1/settings/*').forRoutes('*');
    consumer.apply(HeaderAuthMiddleware).forRoutes('*');
  }
}
