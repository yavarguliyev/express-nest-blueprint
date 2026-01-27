import { ApiController, BaseController, Get, Roles, UserRoles } from '@config/libs';

import { AdminMetricsService } from '@modules/admin/services/admin-metrics.service';
import { ChartData, DashboardAlert, DashboardMetric } from '@modules/admin/interfaces/admin.interface';

@ApiController({ path: '/admin/dashboard' })
@Roles(UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN)
export class AdminDashboardController extends BaseController {
  constructor (private readonly adminMetricsService: AdminMetricsService) {
    super({ path: '/admin/dashboard' });
  }

  @Get('/metrics')
  async getMetrics (): Promise<{ metrics: DashboardMetric[]; charts: ChartData[]; alerts: DashboardAlert[] }> {
    return this.adminMetricsService.getDashboardMetrics();
  }
}
