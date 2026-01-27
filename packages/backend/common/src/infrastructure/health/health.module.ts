import { HealthController } from '../health/health.controller';
import { HealthService } from '../health/health.service';
import { Module } from '../../core/decorators/module.decorator';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService]
})
export class HealthModule {}
