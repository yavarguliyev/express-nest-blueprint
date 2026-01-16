import { Module } from '@common/decorators/module.decorator';
import { HealthController } from '@core/health/health.controller';
import { HealthService } from '@core/health/health.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService]
})
export class HealthModule {}
