import { Controller } from '@common/decorators/controller.decorator';
import { UseGuards } from '@common/decorators/middleware.decorators';
import { Get } from '@common/decorators/route.decorators';
import { ApiSecurity } from '@common/decorators/swagger.decorators';
import { HeaderAuthGuard } from '@common/guards/header-auth.guard';
import { HealthService } from '@core/health/health.service';

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
