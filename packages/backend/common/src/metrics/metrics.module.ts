import { Module } from '../decorators/module.decorator';
import { MetricsController } from '../metrics/metrics.controller';
import { MetricsService } from '../metrics/metrics.service';
import { MetricsMiddleware } from '../middleware/metrics.middleware';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService, MetricsMiddleware],
  exports: [MetricsService, MetricsMiddleware]
})
export class MetricsModule {}
