import { Module } from '@common/decorators/module.decorator';
import { DynamicModule, NestModule } from '@common/interfaces/common.interface';
import { MiddlewareConsumer } from '@common/interfaces/middleware.interface';
import { RequestMethod } from '@common/enums/common.enum';
import { AvatarUploadMiddleware } from '@common/middleware/avatar-upload.middleware';
import { AdminCrudController } from '@modules/admin/controllers/admin-crud.controller';
import { AdminDashboardController } from '@modules/admin/controllers/admin-dashboard.controller';
import { AdminHealthController } from '@modules/admin/controllers/admin-health.controller';
import { AdminProfileController } from '@modules/admin/controllers/admin-profile.controller';
import { AdminUsersController } from '@modules/admin/controllers/admin-users.controller';
import { AdminCrudService } from '@modules/admin/services/admin-crud.service';
import { AdminMetricsService } from '@modules/admin/services/admin-metrics.service';

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
