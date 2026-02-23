import { BaseController, Get, Roles, ApiController, HealthCheckStatus, UserRoles } from '@config/libs';

import { AdminMetricsService } from '@modules/admin/services/admin-metrics.service';

@ApiController({ path: '/admin/health' })
@Roles(UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN)
export class AdminHealthController extends BaseController {
  constructor (private readonly adminMetricsService: AdminMetricsService) {
    super({ path: '/admin/health' });
  }

  @Get()
  async getHealthStatus (): Promise<HealthCheckStatus> {
    return this.adminMetricsService.getHealthStatus();
  }
}
