import { RedisService } from '../redis/redis.service';
import { Injectable } from '../../core/decorators/injectable.decorator';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class CacheService {
  constructor (
    private readonly redisService: RedisService,
    private readonly metricsService: MetricsService
  ) {}

  async get<T> (key: string): Promise<T | null> {
    const data = await this.redisService.getClient().get(key);
    this.metricsService.recordCacheOperation('get', data ? 'hit' : 'miss');
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async set (key: string, value: unknown, ttl?: number, tags: string[] = []): Promise<void> {
    const data = JSON.stringify(value);
    const client = this.redisService.getClient();
    
    if (ttl) await client.set(key, data, 'EX', ttl);
    else await client.set(key, data);

    if (tags.length > 0) {
      for (const tag of tags) {
        const tagKey = `{cache:tag}:${tag}`;
        await client.sadd(tagKey, key);
        if (ttl) await client.expire(tagKey, ttl);
      }
    }

    this.metricsService.recordCacheOperation('set', 'success');
  }

  async invalidateTags (tags: string[]): Promise<void> {
    const client = this.redisService.getClient();
    for (const tag of tags) {
      const tagKey = `{cache:tag}:${tag}`;
      const keys = await client.smembers(tagKey);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => client.del(key)));
        await client.del(tagKey);
      }
    }
  }

  async delete (key: string): Promise<void> {
    await this.redisService.getClient().del(key);
    this.metricsService.recordCacheOperation('delete', 'success');
  }
}
