import { Module } from '@common/decorators';
import { DynamicModule, NestModule, MiddlewareConsumer } from '@common/interfaces';
import { RequestMethod } from '@common/enums';
import { AdminDashboardController } from '@modules/admin/controllers/admin-dashboard.controller';
import { AdminHealthController } from '@modules/admin/controllers/admin-health.controller';
import { AdminUsersController } from '@modules/admin/controllers/admin-users.controller';
import { AdminCrudController } from '@modules/admin/controllers/admin-crud.controller';
import { AdminMetricsService } from '@modules/admin/services/admin-metrics.service';
import { AdminCrudService } from '@modules/admin/services/admin-crud.service';
import { AdminProfileController } from '@modules/admin/controllers/admin-profile.controller';
import { AvatarUploadMiddleware } from '@common/middleware/avatar-upload.middleware';

@Module({
  controllers: [AdminDashboardController, AdminHealthController, AdminUsersController, AdminCrudController, AdminProfileController],
  providers: [AdminMetricsService, AdminCrudService, AvatarUploadMiddleware],
  exports: [AdminMetricsService, AdminCrudService]
})
export class AdminModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer
      .apply(AvatarUploadMiddleware)
      .forRoutes({ path: 'api/v1/admin/profile/upload', method: RequestMethod.POST });
  }

  static forRoot (): DynamicModule {
    return { module: AdminModule, global: false };
  }
}
