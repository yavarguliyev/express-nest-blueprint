import {
  Module,
  MiddlewareConsumer,
  NestModule,
  LoggerMiddleware,
  HeaderAuthMiddleware,
  MetricsMiddleware,
  MaintenanceMiddleware,
  ConfigModule,
  ConfigService,
  SharedModule,
  DatabaseModule,
  GraphQLModule,
  ALL_ROUTES,
  RateLimitMiddleware
} from '@config/libs';

import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { AdminModule } from '@modules/admin/admin.module';
import { ThemesModule } from '@modules/themes/themes.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { UsersResolver } from '@modules/users/users.resolver';
import { AdminCrudResolver } from '@modules/admin/resolvers/admin-crud.resolver';
import { AdminBulkOperationsResolver } from '@modules/admin/resolvers/admin-bulk-operations.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: ConfigService.isProduction()
    }),
    DatabaseModule.forRoot(),
    SharedModule,
    GraphQLModule.forRoot({
      resolvers: [UsersResolver, AdminCrudResolver, AdminBulkOperationsResolver]
    }),
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
    consumer.apply(LoggerMiddleware, MaintenanceMiddleware, RateLimitMiddleware).forRoutes(ALL_ROUTES);
  }
}
