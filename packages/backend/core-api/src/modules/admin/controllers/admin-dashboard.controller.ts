import { AdminGuard, ApiController, BaseController, Get, UseGuards } from '@config/libs';

import { AdminMetricsService } from '@modules/admin/services/admin-metrics.service';

@ApiController({ path: '/admin/dashboard' })
@UseGuards(AdminGuard)
export class AdminDashboardController extends BaseController {
  constructor (private readonly adminMetricsService: AdminMetricsService) {
    super({ path: '/admin/dashboard' });
  }

  @Get('/metrics')
  async getMetrics () {
    return this.adminMetricsService.getDashboardMetrics();
  }
}
