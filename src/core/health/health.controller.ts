import { Controller, Get } from '@common/decorators';
import { ServiceUnavailableException } from '@common/exceptions';
import { HealthService } from '@core/health/health.service';

@Controller('health')
export class HealthController {
  constructor (private readonly healthService: HealthService) {}

  @Get()
  async getHealth () {
    return this.healthService.checkHealth();
  }

  @Get('/live')
  async getLive () {
    return this.healthService.checkLive();
  }

  @Get('/ready')
  async getReady () {
    try {
      return await this.healthService.checkReady();
    } catch (error) {
      throw new ServiceUnavailableException((error as Error).message);
    }
  }
}
