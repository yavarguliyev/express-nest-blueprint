import { Module } from '@common/decorators';
import { DynamicModule } from '@common/interfaces';
import { AdminDashboardController } from '@modules/admin/controllers/admin-dashboard.controller';
import { AdminHealthController } from '@modules/admin/controllers/admin-health.controller';
import { AdminUsersController } from '@modules/admin/controllers/admin-users.controller';
import { AdminCrudController } from '@modules/admin/controllers/admin-crud.controller';
import { AdminMetricsService } from '@modules/admin/services/admin-metrics.service';
import { AdminCrudService } from '@modules/admin/services/admin-crud.service';

@Module({
  controllers: [AdminDashboardController, AdminHealthController, AdminUsersController, AdminCrudController],
  providers: [AdminMetricsService, AdminCrudService],
  exports: [AdminMetricsService, AdminCrudService]
})
export class AdminModule {
  static forRoot (): DynamicModule {
    return {
      module: AdminModule,
      global: false
    };
  }
}
