import { Queue, JobsOptions, Job } from 'bullmq';

import { QueueManager } from '../services/queue-manager.service';
import { Injectable } from '../../../core/decorators/injectable.decorator';
import { BadRequestException } from '../../../domain/exceptions/http-exceptions';

@Injectable()
export class BullMQService {
  constructor (private readonly queueManager: QueueManager) {}

  async addJob<T = unknown> (queueName: string, data: T, options?: JobsOptions): Promise<Job> {
    const queue = this.queueManager.getQueue(queueName);
    if (!queue) throw new BadRequestException(`Queue ${queueName} not found`);
    return await queue.add('job', data, options);
  }

  getQueue (queueName: string): Queue | undefined {
    return this.queueManager.getQueue(queueName);
  }

  async getJobCounts (queueName: string): Promise<{ [index: string]: number }> {
    const queue = this.queueManager.getQueue(queueName);
    if (!queue) throw new BadRequestException(`Queue ${queueName} not found`);
    return await queue.getJobCounts();
  }

  async closeAllQueues (): Promise<void> {
    const queueMap = this.queueManager.getQueues();
    const closePromises = Array.from(queueMap.values()).map(queue => queue.close());
    await Promise.all(closePromises);
  }
}
