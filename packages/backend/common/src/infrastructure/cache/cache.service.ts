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

  async set (key: string, value: unknown, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (ttl) await this.redisService.getClient().set(key, data, 'EX', ttl);
    else await this.redisService.getClient().set(key, data);
    this.metricsService.recordCacheOperation('set', 'success');
  }

  async delete (key: string): Promise<void> {
    await this.redisService.getClient().del(key);
    this.metricsService.recordCacheOperation('delete', 'success');
  }
}
