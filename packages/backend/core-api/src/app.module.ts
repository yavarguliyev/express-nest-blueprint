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
  ConfigService,
  SharedModule,
  DatabaseModule,
  GraphQLModule,
  MIDDLEWARE_EXCLUDE_ROUTES,
  ALL_ROUTES
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
      ignoreEnvFile: ConfigService.isProduction()
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
    consumer.apply(MetricsMiddleware, HeaderAuthMiddleware).forRoutes(ALL_ROUTES);
    consumer
      .apply(LoggerMiddleware, MaintenanceMiddleware, RateLimitMiddleware)
      .exclude(...MIDDLEWARE_EXCLUDE_ROUTES)
      .forRoutes(ALL_ROUTES);
  }
}
