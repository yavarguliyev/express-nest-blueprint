import { Response } from 'express';

import { Controller, Get, Res } from '@common/decorators';
import { MetricsService } from '@core/metrics/metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor (private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics (@Res({ passthrough: true }) res: Response): Promise<string> {
    const metrics = await this.metricsService.getMetrics();
    res.set('Content-Type', this.metricsService.getContentType());
    return metrics;
  }
}
