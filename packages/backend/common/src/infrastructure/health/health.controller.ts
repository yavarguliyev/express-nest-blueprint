import { HealthService } from '../health/health.service';
import { BaseController } from '../../core/controllers/base.controller';
import { UseGuards } from '../../core/decorators/middleware.decorators';
import { HeaderAuthGuard } from '../../core/guards/header-auth.guard';
import { Get } from '../../core/decorators/route.decorators';
import { ApiController } from '../../domain/constants/api/api.const';
import { HealthCheckResult, LiveCheckResult, ReadyCheckResult } from '../../domain/interfaces/health/health-check.interface';

@ApiController({ path: '/health' })
@UseGuards(HeaderAuthGuard)
export class HealthController extends BaseController {
  constructor(private readonly healthService: HealthService) {
    super({ path: 'health' });
  }

  @Get()
  async getHealth(): Promise<HealthCheckResult> {
    return this.healthService.checkHealth();
  }

  @Get('/live')
  getLive(): LiveCheckResult {
    return this.healthService.checkLive();
  }

  @Get('/ready')
  async getReady(): Promise<ReadyCheckResult> {
    return await this.healthService.checkReady();
  }
}
