import { Response } from 'express';

import { MetricsService } from '../metrics/metrics.service';
import { BaseController } from '../../core/controllers/base.controller';
import { UseGuards } from '../../core/decorators/middleware.decorators';
import { Res } from '../../core/decorators/param.decorators';
import { Get } from '../../core/decorators/route.decorators';
import { HeaderAuthGuard } from '../../core/guards/header-auth.guard';
import { ApiController } from '../../domain/constants/api/api.const';

@ApiController({ path: '/metrics' })
@UseGuards(HeaderAuthGuard)
export class MetricsController extends BaseController {
  constructor (private readonly metricsService: MetricsService) {
    super({ path: 'metrics' });
  }

  @Get()
  async getMetrics (@Res({ passthrough: true }) res: Response): Promise<string> {
    return this.metricsService.getMetrics(res);
  }
}
