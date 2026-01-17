import { AdminGuard, ApiController, BaseController, Get, HealthService, UseGuards } from '@config/libs';

import { HealthComponentStatus } from '@modules/admin/interfaces/admin.interface';

@ApiController({ path: '/admin/health' })
@UseGuards(AdminGuard)
export class AdminHealthController extends BaseController {
  constructor (private readonly healthService: HealthService) {
    super({ path: '/admin/health' });
  }

  @Get()
  async getHealthStatus () {
    const health = await this.healthService.checkHealth();

    const components: HealthComponentStatus[] = [];

    if (health.components.database) {
      components.push({
        name: 'Database',
        status: health.components.database.status as 'up' | 'down',
        details: health.components.database
      });
    }

    if (health.components.redis) {
      components.push({
        name: 'Redis',
        status: health.components.redis.status as 'up' | 'down',
        details: health.components.redis
      });
    }

    if (health.components.queues) {
      components.push({
        name: 'Queues',
        status: health.components.queues.status as 'up' | 'down',
        details: health.components.queues
      });
    }

    if (health.components.compute) {
      components.push({
        name: 'Compute Workers',
        status: health.components.compute.status as 'up' | 'down',
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
