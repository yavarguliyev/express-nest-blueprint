import { Module } from '../decorators/module.decorator';
import { MetricsMiddleware } from '../middleware/metrics.middleware';
import { MetricsController } from '../metrics/metrics.controller';
import { MetricsService } from '../metrics/metrics.service';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService, MetricsMiddleware],
  exports: [MetricsService, MetricsMiddleware]
})
export class MetricsModule {}
