import { Controller } from '../../core/decorators/controller.decorator';
import { UseGuards } from '../../core/decorators/middleware.decorators';
import { Get } from '../../core/decorators/route.decorators';
import { ApiSecurity } from '../../core/decorators/swagger.decorators';
import { HeaderAuthGuard } from '../../core/guards/header-auth.guard';
import { HealthService } from '../health/health.service';

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
