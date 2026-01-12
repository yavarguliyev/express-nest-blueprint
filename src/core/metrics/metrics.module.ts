import { Module } from '@common/decorators';
import { MetricsService } from '@core/metrics/metrics.service';
import { MetricsController } from '@core/metrics/metrics.controller';
import { MetricsMiddleware } from '@core/metrics/metrics.middleware';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService, MetricsMiddleware],
  exports: [MetricsService, MetricsMiddleware]
})
export class MetricsModule {}
