import { ApiController, BaseController, Get, HealthCheckResult, HealthService, Roles, UserRoles } from '@config/libs';

import { HealthComponentStatus } from '@modules/admin/interfaces/admin.interface';

@ApiController({ path: '/admin/health' })
@Roles(UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN)
export class AdminHealthController extends BaseController {
  constructor (private readonly healthService: HealthService) {
    super({ path: '/admin/health' });
  }

  @Get()
  async getHealthStatus (): Promise<{
    overallStatus: 'up' | 'down';
    timestamp: string;
    components: HealthComponentStatus[];
  }> {
    const health: HealthCheckResult = await this.healthService.checkHealth();
    const components: HealthComponentStatus[] = [];

    if (health.components.database) {
      components.push({
        name: 'Database',
        status: health.components.database.status,
        details: health.components.database
      });
    }

    if (health.components.redis) {
      components.push({
        name: 'Redis',
        status: health.components.redis.status,
        details: health.components.redis
      });
    }

    if (health.components?.queues) {
      components.push({
        name: 'Queues',
        status: health.components.queues.status,
        details: health.components.queues
      });
    }

    if (health.components.compute) {
      components.push({
        name: 'Compute Workers',
        status: health.components.compute.status,
        details: health.components.compute
      });
    }

    return {
      overallStatus: health.status,
      timestamp: health.timestamp,
      components
    };
  }
}
