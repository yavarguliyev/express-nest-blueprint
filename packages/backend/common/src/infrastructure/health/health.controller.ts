import { HealthService } from '../health/health.service';
import { ApiSecurity } from '../../core/decorators/swagger.decorators';
import { Controller } from '../../core/decorators/controller.decorator';
import { UseGuards } from '../../core/decorators/middleware.decorators';
import { HeaderAuthGuard } from '../../core/guards/header-auth.guard';
import { Get } from '../../core/decorators/route.decorators';
import { HealthCheckResult, LiveCheckResult, ReadyCheckResult } from '../../domain/interfaces/common.interface';

@ApiSecurity('health-key')
@Controller('health')
@UseGuards(HeaderAuthGuard)
export class HealthController {
  constructor (private readonly healthService: HealthService) {}

  @Get()
  async getHealth (): Promise<HealthCheckResult> {
    return this.healthService.checkHealth();
  }

  @Get('/live')
  getLive (): LiveCheckResult {
    return this.healthService.checkLive();
  }

  @Get('/ready')
  async getReady (): Promise<ReadyCheckResult> {
    return await this.healthService.checkReady();
  }
}
