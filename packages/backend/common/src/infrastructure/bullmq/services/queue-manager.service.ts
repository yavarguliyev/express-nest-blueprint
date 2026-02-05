import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';

import { RedisService } from '../../redis/redis.service';
import { Injectable } from '../../../core/decorators/injectable.decorator';
import { BadRequestException } from '../../../domain/exceptions/http-exceptions';
import { QueueHealth } from '../../../domain/interfaces/infra/bullmq.interface';

@Injectable()
export class QueueManager {
  private readonly queues = new Map<string, Queue>();
  private readonly redis: Redis;

  constructor (private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  createQueue (name: string, options?: Partial<QueueOptions>): Queue {
    if (this.queues.has(name)) return this.queues.get(name)!;

    const queueOptions: QueueOptions = {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      },
      ...options
    };

    const queue = new Queue(name, queueOptions);
    this.queues.set(name, queue);

    return queue;
  }

  getQueue (name: string): Queue | undefined {
    return this.queues.get(name);
  }

  getAllQueues (): Map<string, Queue> {
    return new Map(this.queues);
  }

  getQueues (): Map<string, Queue> {
    return this.queues;
  }

  async closeAllQueues (): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closePromises);
    this.queues.clear();
  }

  async getQueueHealth (queueName: string): Promise<QueueHealth> {
    const queue = this.getQueue(queueName);
    if (!queue) throw new BadRequestException(`Queue ${queueName} not found`);
    const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');

    return {
      queueName,
      waiting: counts['waiting'] || 0,
      active: counts['active'] || 0,
      completed: counts['completed'] || 0,
      failed: counts['failed'] || 0,
      delayed: counts['delayed'] || 0
    };
  }
}
