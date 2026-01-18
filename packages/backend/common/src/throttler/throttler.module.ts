import { Module } from '../decorators/module.decorator';
import { RateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { ThrottlerService } from '../throttler/throttler.service';

@Module({
  providers: [ThrottlerService, RateLimitMiddleware],
  exports: [ThrottlerService, RateLimitMiddleware]
})
export class ThrottlerModule {}
