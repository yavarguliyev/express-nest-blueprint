import { Worker, Job } from 'bullmq';

import { Container } from '../../core/container/container';
import { Injectable } from '../../core/decorators/injectable.decorator';
import { Logger } from '../logger/logger.service';
import { RedisService } from '../redis/redis.service';
import { BULLMQ_PROCESSOR_METADATA, BULLMQ_JOB_HANDLER_METADATA, BULLMQ_PROCESSOR_REGISTRY } from '../../domain/constants/infra/bullmq.const';
import { BullMQJobHandlerMetadata } from '../../domain/interfaces/infra/bullmq.interface';
import { getErrorMessage } from '../../domain/helpers/utility-functions.helper';

@Injectable()
export class BullMQExplorer {
  private readonly logger = new Logger(BullMQExplorer.name);
  private readonly workers: Worker[] = [];

  constructor(
    private readonly container: Container,
    private readonly redisService: RedisService
  ) {}

  explore(): void {
    for (const processorClass of BULLMQ_PROCESSOR_REGISTRY) {
      if (!this.container.has(processorClass)) this.container.register({ provide: processorClass, useClass: processorClass });

      const instance = this.container.resolve<object>({ provide: processorClass });
      const queueName = Reflect.getMetadata(BULLMQ_PROCESSOR_METADATA, processorClass) as string;
      const handlers = Reflect.getMetadata(BULLMQ_JOB_HANDLER_METADATA, processorClass) as BullMQJobHandlerMetadata[] | undefined;

      if (!queueName || !handlers) continue;

      const queueNameWithHash = queueName.startsWith('{') ? queueName : `{${queueName}}`;

      const worker = new Worker(
        queueNameWithHash,
        async (job: Job) => {
          const handler = handlers.find(h => h.jobName === job.name);

          if (handler) {
            const method = (instance as Record<string, (...args: unknown[]) => Promise<unknown>>)[handler.methodName];
            if (typeof method === 'function') return await method.apply(instance, [job]);
          }

          await this.logger.warn(`No handler found for job ${job.name} in queue ${queueName}`);
          return;
        },
        { connection: this.redisService.getClient() }
      );

      worker.on('failed', (job, err) => void this.logger.error(`Job ${job?.id} failed in queue ${queueName}`, getErrorMessage(err)));

      this.workers.push(worker);
    }
  }

  async closeAll(): Promise<void> {
    await Promise.all(this.workers.map(worker => worker.close()));
  }
}
