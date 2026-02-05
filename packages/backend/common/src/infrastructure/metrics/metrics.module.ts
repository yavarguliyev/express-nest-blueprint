import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { Module } from '../../core/decorators/module.decorator';
import { MetricsMiddleware } from '../../core/middleware/metrics.middleware';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService, MetricsMiddleware],
  exports: [MetricsService, MetricsMiddleware],
  global: true
})
export class MetricsModule {}
