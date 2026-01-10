import { Queue, JobsOptions } from 'bullmq';

import { Injectable } from '@common/decorators';
import { BadRequestException } from '@common/exceptions';
import { QueueManager } from '@core/bullmq/services/queue-manager.service';

@Injectable()
export class BullMQService {
  constructor (private readonly queueManager: QueueManager) {}

  async addJob<T = unknown> (queueName: string, jobName: string, data: T, options?: JobsOptions) {
    const queue = this.queueManager.getQueue(queueName);
    if (!queue) throw new BadRequestException(`Queue ${queueName} not found`);

    return await queue.add(jobName, data, options);
  }

  getQueue (queueName: string): Queue | undefined {
    return this.queueManager.getQueue(queueName);
  }

  async getQueueHealth (queueName: string) {
    return this.queueManager.getQueueHealth(queueName);
  }

  async shutdown (): Promise<void> {
    await this.queueManager.closeAllQueues();
  }
}
