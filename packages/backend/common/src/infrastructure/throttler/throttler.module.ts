import { Module } from '../../core/decorators/module.decorator';
import { RateLimitMiddleware } from '../../core/middleware/rate-limit.middleware';
import { ThrottlerService } from '../throttler/throttler.service';

@Module({
  providers: [ThrottlerService, RateLimitMiddleware],
  exports: [ThrottlerService, RateLimitMiddleware]
})
export class ThrottlerModule {}
