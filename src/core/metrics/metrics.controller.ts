import { Response } from 'express';

import { Controller, Get, Res, UseGuards, ApiSecurity } from '@common/decorators';
import { MetricsService } from '@core/metrics/metrics.service';
import { HeaderAuthGuard } from '@common/guards';

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
