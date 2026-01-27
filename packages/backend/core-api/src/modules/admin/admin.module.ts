import { AvatarUploadMiddleware, DynamicModule, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@config/libs';

import { AdminCrudController } from '@modules/admin/controllers/admin-crud.controller';
import { AdminBulkOperationsController } from '@modules/admin/controllers/admin-bulk-operations.controller';
import { AdminDashboardController } from '@modules/admin/controllers/admin-dashboard.controller';
import { AdminHealthController } from '@modules/admin/controllers/admin-health.controller';
import { AdminProfileController } from '@modules/admin/controllers/admin-profile.controller';
import { AdminCrudService } from '@modules/admin/services/admin-crud.service';
import { AdminBulkOperationsService } from '@modules/admin/services/admin-bulk-operations.service';
import { AdminMetricsService } from '@modules/admin/services/admin-metrics.service';

@Module({
  controllers: [AdminDashboardController, AdminHealthController, AdminCrudController, AdminBulkOperationsController, AdminProfileController],
  providers: [AdminMetricsService, AdminCrudService, AdminBulkOperationsService, AvatarUploadMiddleware],
  exports: [AdminMetricsService, AdminCrudService, AdminBulkOperationsService]
})
export class AdminModule implements NestModule {
  configure (consumer: MiddlewareConsumer): void {
    consumer.apply(AvatarUploadMiddleware).forRoutes({ path: 'api/v1/admin/profile/upload', method: RequestMethod.POST });
  }

  static forRoot (): DynamicModule {
    return { module: AdminModule, global: false };
  }
}
