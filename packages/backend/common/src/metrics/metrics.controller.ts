import { Response } from 'express';

import { Controller } from '../decorators/controller.decorator';
import { UseGuards } from '../decorators/middleware.decorators';
import { Res } from '../decorators/param.decorators';
import { Get } from '../decorators/route.decorators';
import { ApiSecurity } from '../decorators/swagger.decorators';
import { HeaderAuthGuard } from '../guards/header-auth.guard';
import { MetricsService } from '../metrics/metrics.service';

@ApiSecurity('health-key')
@Controller('metrics')
@UseGuards(HeaderAuthGuard)
export class MetricsController {
  constructor (private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics (@Res({ passthrough: true }) res: Response): Promise<string> {
    const metrics = await this.metricsService.getMetrics();
    res.set('Content-Type', this.metricsService.getContentType());
    return metrics;
  }
}
