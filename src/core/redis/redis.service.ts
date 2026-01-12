import Redis from 'ioredis';

import { Injectable, Inject, BULLMQ_OPTIONS } from '@common/decorators';
import { BullMQModuleOptions } from '@common/interfaces';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor (@Inject(BULLMQ_OPTIONS) options: BullMQModuleOptions) {
    const password = options.redis.password || undefined;

    this.redis = new Redis({
      host: options.redis.host,
      port: options.redis.port || 6379,
      ...(password ? { password } : {}),
      db: options.redis.db || 0,
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    });
  }

  getClient (): Redis {
    return this.redis;
  }

  async disconnect (): Promise<void> {
    await this.redis.quit();
  }
}
