import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';

import { Injectable } from '@common/decorators';
import { BadRequestException } from '@common/exceptions';
import { getErrorMessage } from '@common/helpers';
import { BullMQModuleOptions, QueueHealth } from '@common/interfaces';
import { Logger } from '@common/logger/logger.service';

@Injectable()
export class QueueManager {
  private readonly logger = new Logger('QueueManager');
  private readonly queues = new Map<string, Queue>();
  private readonly redis: Redis;

  constructor (private readonly options: BullMQModuleOptions) {
    this.redis = new Redis({
      host: options.redis.host,
      port: options.redis.port || 6379,
      password: options.redis.password ?? '',
      db: options.redis.db || 0,
      maxRetriesPerRequest: null,
      lazyConnect: true
    });

    this.redis.on('error', (error) => this.logger.error('Redis connection error', getErrorMessage(error), 'QueueManager'));
  }

  createQueue (name: string, options?: Partial<QueueOptions>): Queue {
    if (this.queues.has(name)) return this.queues.get(name)!;

    const queueOptions: QueueOptions = { connection: this.redis, defaultJobOptions: { ...this.options.defaultJobOptions }, ...this.options.queueOptions, ...options };
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

  async closeAllQueues (): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map((queue) => queue.close());
    await Promise.all(closePromises);

    this.redis.disconnect();
    this.queues.clear();
  }

  async getQueueHealth (queueName: string): Promise<QueueHealth> {
    const queue = this.getQueue(queueName);
    if (!queue) throw new BadRequestException(`Queue ${queueName} not found`);
    const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');

    return {
      waiting: counts['waiting'] ?? 0,
      active: counts['active'] ?? 0,
      completed: counts['completed'] ?? 0,
      failed: counts['failed'] ?? 0,
      delayed: counts['delayed'] ?? 0
    };
  }
}
