import { Injectable } from '../decorators/injectable.decorator';
import { BadRequestException } from '../exceptions/http-exceptions';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ThrottlerService {
  constructor (private readonly redisService: RedisService) {}

  async checkRateLimit (key: string, limit: number, ttl: number) {
    const redis = this.redisService.getClient();
    const fullKey = `throttle:${key}`;

    const multi = redis.multi();

    multi.incr(fullKey);
    multi.ttl(fullKey);

    const results = await multi.exec();

    if (!results || !results[0] || !results[1]) {
      throw new BadRequestException('Redis multi-exec failed or returned partial results');
    }

    const count = (results[0][1] as number) ?? 1;
    let expiresAt = (results[1][1] as number) ?? ttl;

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
}
