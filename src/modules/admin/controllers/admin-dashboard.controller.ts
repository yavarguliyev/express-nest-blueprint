import { ApiController, BaseController } from '@common/controllers/base.controller';
import { UseGuards } from '@common/decorators/middleware.decorators';
import { Get } from '@common/decorators/route.decorators';
import { AdminGuard } from '@common/guards/admin.guard';
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
