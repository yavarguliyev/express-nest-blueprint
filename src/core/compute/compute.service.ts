import { Worker, Job, QueueEvents } from 'bullmq';

import { Container } from '@common/container';
import { Injectable, Inject, BULLMQ_OPTIONS, BULLMQ_SERVICE_TOKEN, QUEUE_MANAGER_TOKEN } from '@common/decorators';
import { BadRequestException } from '@common/exceptions';
import { BullMQModuleOptions, ComputeHandler, ComputeModuleOptions, JobData, PatchedMethod } from '@common/interfaces';
import { Logger } from '@common/logger';
import { Constructor } from '@common/types';
import { BullMQService } from '@core/bullmq/services/bullmq.service';
import { QueueManager } from '@core/bullmq/services/queue-manager.service';

@Injectable()
export class ComputeService {
  private readonly logger = new Logger('ComputeService');
  private handlers = new Map<string, ComputeHandler>();
  private readonly QUEUE_NAME = 'compute-queue';
  private worker!: Worker;
  private queueEvents!: QueueEvents;

  constructor (
    @Inject(BULLMQ_SERVICE_TOKEN) private readonly bullMqService: BullMQService,
    @Inject(BULLMQ_OPTIONS) private readonly options: BullMQModuleOptions,
    @Inject(QUEUE_MANAGER_TOKEN) private readonly queueManager: QueueManager,
    @Inject('COMPUTE_MODULE_OPTIONS') private readonly moduleOptions: ComputeModuleOptions
  ) {}

  public start (): void {
    const connection = {
      host: this.options.redis.host,
      port: this.options.redis.port || 6379,
      password: this.options.redis.password || '',
      db: this.options.redis.db || 0
    };

    this.queueEvents = new QueueEvents(this.QUEUE_NAME, { connection });
    this.queueManager.createQueue(this.QUEUE_NAME);

    if (this.moduleOptions.enableWorker === false) return;

    this.worker = new Worker(
      this.QUEUE_NAME,
      async (job: Job) => this.executeJob(job.data as JobData),
      {
        connection: {
          host: this.options.redis.host,
          port: this.options.redis.port || 6379,
          password: this.options.redis.password || '',
          db: this.options.redis.db || 0
        },
        concurrency: this.options.redis.concurrency || 5
      }
    );

    this.worker.on('failed', (job, err) => this.logger.error(`Compute job ${job?.id} failed: ${err}`));
  }

  public registerHandler (handler: ComputeHandler): void {
    const key = this.getHandlerKey(handler.serviceToken, handler.methodName);
    this.handlers.set(key, handler);
  }

  public async offload (serviceToken: unknown, methodName: string, args: unknown[]): Promise<unknown> {
    const key = this.getHandlerKey(serviceToken, methodName);
    const handler = this.handlers.get(key);
    if (!handler) throw new BadRequestException(`No handler registered for ${String(serviceToken)}.${methodName}`);

    this.logger.log(`📤 Offloading ${key} to worker...`, 'Compute');
    const job = await this.bullMqService.addJob(this.QUEUE_NAME, 'compute-job', { handlerKey: key, args }, handler.options);
    if (handler.options.background) return job;

    try {
      const result = await job.waitUntilFinished(this.queueEvents);
      this.logger.log(`✅ Offloaded job ${key} completed`, 'Compute');
      return result;
    } catch (err) {
      const failedJob = await Job.fromId(this.bullMqService.getQueue(this.QUEUE_NAME)!, job.id!);
      this.logger.error(`❌ Offloaded job ${key} failed: ${failedJob?.failedReason || 'Unknown error'}`, 'Compute');
      throw new BadRequestException(failedJob?.failedReason || 'Job failed');
    }
  }

  public async executeJob (jobData: JobData): Promise<unknown> {
    const { handlerKey, args } = jobData;

    const handler = this.handlers.get(handlerKey);
    if (!handler) throw new BadRequestException(`Handler not found for key: ${handlerKey}`);

    this.logger.log(`⚙️ Executing job: ${handlerKey}`, 'Worker');

    const container = Container.getInstance();
    const serviceInstance = container.resolve<Record<string, unknown>>({ provide: handler.serviceToken as Constructor<Record<string, unknown>> | string | symbol });
    const method = serviceInstance[handler.methodName];

    if (typeof method === 'function') {
      const patchedMethod = method as PatchedMethod;
      if (patchedMethod.__original__) return await patchedMethod.__original__.apply(serviceInstance, args);
      return await patchedMethod.apply(serviceInstance, args);
    }

    throw new BadRequestException(`Method ${handler.methodName} not found or not executable on service.`);
  }

  private getHandlerKey (token: unknown, method: string): string {
    let tokenName = String(token);

    if (typeof token === 'function' && 'name' in token) tokenName = (token as { name: string }).name;
    else if (typeof token === 'object' && token !== null && 'constructor' in token) tokenName = (token as { constructor: { name: string } }).constructor.name;

    return `${tokenName}:${method}`;
  }

  async close (): Promise<void> {
    if (this.worker) await this.worker.close();
    if (this.queueEvents) await this.queueEvents.close();
  }
}
