import { AvatarUploadMiddleware, DynamicModule, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@config/libs';

import { AdminCrudController } from '@modules/admin/controllers/admin-crud.controller';
import { AdminDashboardController } from '@modules/admin/controllers/admin-dashboard.controller';
import { AdminHealthController } from '@modules/admin/controllers/admin-health.controller';
import { AdminProfileController } from '@modules/admin/controllers/admin-profile.controller';
import { AdminCrudService } from '@modules/admin/services/admin-crud.service';
import { AdminMetricsService } from '@modules/admin/services/admin-metrics.service';

@Module({
  controllers: [AdminDashboardController, AdminHealthController, AdminCrudController, AdminProfileController],
  providers: [AdminMetricsService, AdminCrudService, AvatarUploadMiddleware],
  exports: [AdminMetricsService, AdminCrudService]
})
export class AdminModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer.apply(AvatarUploadMiddleware).forRoutes({ path: 'api/v1/admin/profile/upload', method: RequestMethod.POST });
  }

  static forRoot (): DynamicModule {
    return { module: AdminModule, global: false };
  }
}
