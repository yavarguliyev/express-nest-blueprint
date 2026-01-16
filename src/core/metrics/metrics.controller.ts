import { Response } from 'express';

import { Controller } from '@common/decorators/controller.decorator';
import { UseGuards } from '@common/decorators/middleware.decorators';
import { Res } from '@common/decorators/param.decorators';
import { Get } from '@common/decorators/route.decorators';
import { ApiSecurity } from '@common/decorators/swagger.decorators';
import { HeaderAuthGuard } from '@common/guards/header-auth.guard';
import { MetricsService } from '@core/metrics/metrics.service';

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
