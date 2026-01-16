import { Module } from '@common/decorators/module.decorator';
import { RateLimitMiddleware } from '@/common/middleware/rate-limit.middleware';
import { ThrottlerService } from '@core/throttler/throttler.service';

@Module({
  providers: [ThrottlerService, RateLimitMiddleware],
  exports: [ThrottlerService, RateLimitMiddleware]
})
export class ThrottlerModule {}
