import { QueueEvents, Job } from 'bullmq';

import { Injectable, RedisService } from '@config/libs';

@Injectable()
export class QueueManagerHelper {
  private queueEventsMap = new Map<string, QueueEvents>();

  constructor (private readonly redisService: RedisService) {}

  async waitForJobCompletion (queueName: string, job: Job): Promise<unknown> {
    const queueNameWithHash = queueName.startsWith('{') ? queueName : `{${queueName}}`;
    let queueEvents = this.queueEventsMap.get(queueNameWithHash);

    if (!queueEvents) {
      queueEvents = new QueueEvents(queueNameWithHash, { connection: this.redisService.getClient() });
      this.queueEventsMap.set(queueNameWithHash, queueEvents);
    }

    return await job.waitUntilFinished(queueEvents, 60000);
  }

  async close (): Promise<void> {
    for (const queueEvents of this.queueEventsMap.values()) {
      await queueEvents.close();
    }

    this.queueEventsMap.clear();
  }
}
