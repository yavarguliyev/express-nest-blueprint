import { RedisService } from '../redis/redis.service';
import { Injectable } from '../../core/decorators/injectable.decorator';
import { BadRequestException } from '../../domain/exceptions/http-exceptions';
import { CheckRateLimitParams, RateLimitStatus } from '../../domain/interfaces/infra/infra-common.interface';

@Injectable()
export class ThrottlerService {
  constructor(private readonly redisService: RedisService) {}

  async checkRateLimit(params: CheckRateLimitParams): Promise<RateLimitStatus> {
    const { key, limit, ttl } = params;
    const redis = this.redisService.getClient();
    const fullKey = `throttle:${key}`;

    const multi = redis.multi();

    multi.incr(fullKey);
    multi.ttl(fullKey);

    const results = await multi.exec();

    if (!results || !results[0] || !results[1]) {
      throw new BadRequestException('Redis multi-exec failed or returned partial results');
    }

    const count = this.resolveResultValue(results[0][1], 1);
    let expiresAt = this.resolveResultValue(results[1][1], ttl);

    if (count === 1 || expiresAt <= 0) {
      await redis.expire(fullKey, ttl);
      expiresAt = ttl;
    }

    return {
      total: count,
      remaining: Math.max(0, limit - count),
      reset: expiresAt,
      isBlocked: count > limit
    };
  }

  private resolveResultValue = (value: unknown, fallback: number): number => (typeof value === 'number' ? value : fallback);
}
