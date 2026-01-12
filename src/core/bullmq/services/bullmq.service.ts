import { Queue, JobsOptions } from 'bullmq';

import { Injectable } from '@common/decorators';
import { BadRequestException } from '@common/exceptions';
import { QueueManager } from '@core/bullmq/services/queue-manager.service';

@Injectable()
export class BullMQService {
  constructor (private readonly queueManager: QueueManager) {}

  async addJob<T = unknown> (queueName: string, data: T, options?: JobsOptions) {
    const queue = this.queueManager.getQueue(queueName);
    if (!queue) throw new BadRequestException(`Queue ${queueName} not found`);

    return await queue.add('job', data, options);
  }

  getQueue (queueName: string): Queue | undefined {
    return this.queueManager.getQueue(queueName);
  }

  async getJobCounts (queueName: string) {
    const queue = this.queueManager.getQueue(queueName);
    if (!queue) throw new BadRequestException(`Queue ${queueName} not found`);

    return await queue.getJobCounts();
  }

  async closeAll (): Promise<void> {
    await this.queueManager.closeAllQueues();
  }
}
