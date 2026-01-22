import Redis from 'ioredis';

import { BULLMQ_OPTIONS } from '../../core/decorators/bullmq.decorators';
import { Injectable, Inject } from '../../core/decorators/injectable.decorator';
import { BullMQModuleOptions } from '../../domain/interfaces/bullmq.interface';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor (@Inject(BULLMQ_OPTIONS) options: BullMQModuleOptions) {
    const password = options.redis.password || undefined;
    const clusterNodes = process.env['REDIS_CLUSTER_NODES'];

    if (clusterNodes) {
      const nodes = clusterNodes.split(',').map((node) => {
        const parts = node.split(':');
        const host = parts[0] || 'localhost';
        const port = parseInt(parts[1] || '6379', 10);
        return { host, port };
      });

      this.redis = new Redis.Cluster(nodes, {
        redisOptions: {
          ...(password ? { password } : {}),
          enableReadyCheck: false,
          maxRetriesPerRequest: null
        }
      }) as unknown as Redis;
    } else {
      this.redis = new Redis({
        host: options.redis.host,
        port: options.redis.port || 6379,
        ...(password ? { password } : {}),
        db: options.redis.db || 0,
        maxRetriesPerRequest: null,
        enableReadyCheck: false
      });
    }
  }

  getClient (): Redis {
    return this.redis;
  }

  async disconnect (): Promise<void> {
    await this.redis.quit();
  }
}
