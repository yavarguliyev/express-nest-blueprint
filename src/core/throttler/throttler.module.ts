import { Module } from '@common/decorators';
import { ThrottlerService } from '@core/throttler/throttler.service';
import { RateLimitMiddleware } from '@core/throttler/rate-limit.middleware';

@Module({
  providers: [ThrottlerService, RateLimitMiddleware],
  exports: [ThrottlerService, RateLimitMiddleware]
})
export class ThrottlerModule {}
