import { Module } from '@common/decorators';
import { MiddlewareConsumer, NestModule } from '@common/interfaces';
import { LoggerMiddleware } from '@common/middleware';
import { ConfigModule } from '@core/config';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }), SharedModule, UsersModule, AuthModule],
  controllers: [],
  providers: [],
  exports: []
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
