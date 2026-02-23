import { AvatarUploadMiddleware, Module, DynamicModule, MiddlewareConsumer, NestModule, RequestMethod, QueueManagerHelper } from '@config/libs';

import { AdminCrudController } from '@modules/admin/controllers/admin-crud.controller';
import { AdminBulkOperationsController } from '@modules/admin/controllers/admin-bulk-operations.controller';
import { AdminDashboardController } from '@modules/admin/controllers/admin-dashboard.controller';
import { AdminHealthController } from '@modules/admin/controllers/admin-health.controller';
import { AdminProfileController } from '@modules/admin/controllers/admin-profile.controller';
import { AdminCrudService } from '@modules/admin/services/admin-crud.service';
import { AdminBulkOperationsService } from '@modules/admin/services/admin-bulk-operations.service';
import { AdminMetricsService } from '@modules/admin/services/admin-metrics.service';
import { DashboardMetricsBuilder } from '@modules/admin/services/metrics/dashboard-metrics';
import { MetricResolver } from '@modules/admin/services/metrics/metric-resolver';
import { MetricCalculators } from '@modules/admin/services/metrics/metric-calculators';
import { CreateOperations } from '@modules/admin/services/crud-operations/operations/create-operations';
import { ReadOperations } from '@modules/admin/services/crud-operations/operations/read-operations';
import { UpdateOperations } from '@modules/admin/services/crud-operations/operations/update-operations';
import { DeleteOperations } from '@modules/admin/services/crud-operations/operations/delete-operations';
import { SchemaBuilder } from '@modules/admin/services/crud-operations/schema-builder';
import { RepositoryRegistrar } from '@modules/admin/services/crud-operations/repository-registrar';
import { AdminCommandsWorker } from '@modules/admin/workers/admin-commands.worker';
import { AdminCrudResolver } from '@modules/admin/resolvers/admin-crud.resolver';
import { AdminBulkOperationsResolver } from '@modules/admin/resolvers/admin-bulk-operations.resolver';

@Module({
  controllers: [AdminDashboardController, AdminHealthController, AdminCrudController, AdminBulkOperationsController, AdminProfileController],
  providers: [
    AdminMetricsService,
    DashboardMetricsBuilder,
    MetricResolver,
    MetricCalculators,
    AdminCrudService,
    RepositoryRegistrar,
    QueueManagerHelper,
    SchemaBuilder,
    CreateOperations,
    ReadOperations,
    UpdateOperations,
    DeleteOperations,
    AdminBulkOperationsService,
    AvatarUploadMiddleware,
    AdminCommandsWorker,
    AdminCrudResolver,
    AdminBulkOperationsResolver
  ],
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
