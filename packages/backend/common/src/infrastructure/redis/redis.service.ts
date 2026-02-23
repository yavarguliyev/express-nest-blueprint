import Redis, { Cluster } from 'ioredis';

import { BULLMQ_OPTIONS } from '../../core/decorators/bullmq.decorators';
import { Inject, Injectable } from '../../core/decorators/injectable.decorator';
import { BullMQModuleOptions } from '../../domain/interfaces/infra/bullmq.interface';
import { ConfigService } from '../../infrastructure/config/config.service';

@Injectable()
export class RedisService {
  private readonly redis: Redis | Cluster;

  constructor(
    @Inject(BULLMQ_OPTIONS) options: BullMQModuleOptions,
    private readonly configService: ConfigService
  ) {
    const password = options.redis.password || undefined;
    const clusterNodes = this.configService.get<string>('REDIS_CLUSTER_NODES', '');

    if (clusterNodes) {
      const nodes = clusterNodes.split(',').map(node => {
        const [host, port] = node.split(':');
        if (password) return `redis://:${password}@${host}:${port || 6379}`;
        return { host, port: parseInt(port || '6379', 10) };
      });

      this.redis = new Redis.Cluster(nodes as (string | { host: string; port: number })[], {
        redisOptions: {
          ...(password ? { password } : {}),
          enableReadyCheck: true,
          maxRetriesPerRequest: null
        },
        clusterRetryStrategy: (times: number): number => Math.min(times * 100, 3000)
      });
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

  getClient = (): Redis | Cluster => this.redis;

  async getMemoryUsage(): Promise<number> {
    try {
      const info = await this.redis.info('memory');
      const usedMemory = info.match(/used_memory:(\d+)/)?.[1];
      return usedMemory ? parseInt(usedMemory, 10) : 0;
    } catch {
      return 0;
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
