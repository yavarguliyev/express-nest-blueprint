import { Response } from 'express';

import { Controller } from '../../core/decorators/controller.decorator';
import { UseGuards } from '../../core/decorators/middleware.decorators';
import { Res } from '../../core/decorators/param.decorators';
import { Get } from '../../core/decorators/route.decorators';
import { ApiSecurity } from '../../core/decorators/swagger.decorators';
import { HeaderAuthGuard } from '../../core/guards/header-auth.guard';
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
