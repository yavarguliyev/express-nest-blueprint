import { Module } from '@common/decorators/module.decorator';
import { MetricsMiddleware } from '@common/middleware/metrics.middleware';
import { MetricsController } from '@core/metrics/metrics.controller';
import { MetricsService } from '@core/metrics/metrics.service';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService, MetricsMiddleware],
  exports: [MetricsService, MetricsMiddleware]
})
export class MetricsModule {}
