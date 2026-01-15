import { Controller, Get, UseGuards, ApiSecurity } from '@common/decorators';
import { HealthService } from '@core/health/health.service';
import { HeaderAuthGuard } from '@common/guards';

@ApiSecurity('health-key')
@Controller('health')
@UseGuards(HeaderAuthGuard)
export class HealthController {
  constructor (private readonly healthService: HealthService) {}

  @Get()
  async getHealth () {
    return this.healthService.checkHealth();
  }

  @Get('/live')
  getLive () {
    return this.healthService.checkLive();
  }

  @Get('/ready')
  async getReady () {
    return await this.healthService.checkReady();
  }
}
