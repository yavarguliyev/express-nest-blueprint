import { Module } from '@common/decorators';
import { HealthService } from '@core/health/health.service';
import { HealthController } from '@core/health/health.controller';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService]
})
export class HealthModule {}
