import { Worker, Job, QueueEvents } from 'bullmq';

import { Container } from '@common/container';
import { Injectable, Inject, BULLMQ_OPTIONS, COMPUTE_MODULE_OPTIONS } from '@common/decorators';
import { BadRequestException, ServiceUnavailableException } from '@common/exceptions';
import { BullMQModuleOptions, ComputeHandler, ComputeModuleOptions, PatchedMethod, ComputeJobData, ComputeOptions, PendingJob } from '@common/interfaces';
import { getErrorMessage } from '@common/helpers';
import { Logger } from '@common/logger';
import { Constructor } from '@common/types';
import { BullMQService } from '@core/bullmq/services/bullmq.service';
import { QueueManager } from '@core/bullmq/services/queue-manager.service';

@Injectable()
export class ComputeService {
  private readonly logger = new Logger('ComputeService');
  private handlers = new Map<string, ComputeHandler>();
  private pendingJobs = new Map<string, PendingJob>();
  private readonly QUEUE_NAME = 'compute-queue';
  private worker!: Worker;
  private queueEvents!: QueueEvents;

  constructor (
    private readonly bullMqService: BullMQService,
    @Inject(BULLMQ_OPTIONS) private readonly options: BullMQModuleOptions,
    private readonly queueManager: QueueManager,
    @Inject(COMPUTE_MODULE_OPTIONS) private readonly moduleOptions: ComputeModuleOptions
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

    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      const pending = this.pendingJobs.get(jobId);
      if (pending) {
        pending.resolve(returnvalue);
        this.pendingJobs.delete(jobId);
      }
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      const pending = this.pendingJobs.get(jobId);
      if (pending) {
        pending.reject(new ServiceUnavailableException(failedReason));
        this.pendingJobs.delete(jobId);
      }
    });

    if (this.moduleOptions.enableWorker === false) return;

    this.worker = new Worker(this.QUEUE_NAME, async (job: Job) => this.executeJob(job.data as ComputeJobData), {
      connection,
      concurrency: 10
    });

    this.worker.on('completed', (job: Job) => this.logger.log(`✅ Job ${job.id} completed successfully`));
    this.worker.on('failed', (job: Job | undefined, err: Error) => this.logger.error(`❌ Job ${job?.id} failed: ${err.message}`));
  }

  public registerHandler (taskName: string, handler: ComputeHandler): void {
    this.handlers.set(taskName, handler);
  }

  public patchMethod<T extends object> (instance: T, methodName: string, taskName: string, options: ComputeOptions = {}): void {
    const originalMethod = (instance as Record<string, unknown>)[methodName] as (...args: unknown[]) => Promise<unknown>;

    if (!originalMethod || typeof originalMethod !== 'function') throw new BadRequestException(`Method ${methodName} not found on instance`);

    const patchedMethod = async (...args: unknown[]): Promise<unknown> => {
      if (this.moduleOptions.enableApi === false) {
        return originalMethod.apply(instance, args);
      }

      try {
        const job = await this.bullMqService.addJob<ComputeJobData>(this.QUEUE_NAME, {
          taskName,
          args,
          timestamp: Date.now()
        });

        this.logger.log(`🚀 Offloading task ${taskName} to background (Job ID: ${job.id})`);

        const timeout = options.timeout ?? 5000;

        return await Promise.race([
          new Promise((resolve, reject) => {
            this.pendingJobs.set(job.id!, { resolve, reject });
          }),
          new Promise((_, reject) => {
            setTimeout(() => {
              this.pendingJobs.delete(job.id!);
              reject(new ServiceUnavailableException(`Task ${taskName} timed out after ${timeout}ms`));
            }, timeout);
          })
        ]);
      } catch (error) {
        this.logger.warn(`⚠️ Compute offloading failed for ${taskName}: ${getErrorMessage(error)}. Falling back to local execution.`);
        return originalMethod.apply(instance, args);
      }
    };

    (patchedMethod as PatchedMethod).__original__ = originalMethod as (...args: unknown[]) => Promise<unknown>;
    (instance as Record<string, unknown>)[methodName] = patchedMethod;
  }

  private async executeJob (data: ComputeJobData): Promise<unknown> {
    const { taskName, args } = data;
    const handler = this.handlers.get(taskName);

    if (!handler) throw new BadRequestException(`Handler for task ${taskName} not found`);

    const instance = Container.getInstance().resolve({ provide: handler.serviceToken as Constructor });
    const method = (instance as Record<string, unknown>)[handler.methodName] as (...args: unknown[]) => Promise<unknown>;

    return method.apply(instance, args);
  }

  public getStatus () {
    return {
      workerEnabled: !!this.worker,
      workerStatus: this.worker ? (this.worker.isRunning() ? 'running' : 'stopped') : 'not_initialized',
      pendingJobsCount: this.pendingJobs.size,
      handlersCount: this.handlers.size
    };
  }

  public async close (): Promise<void> {
    if (this.worker) await this.worker.close();
    if (this.queueEvents) await this.queueEvents.close();

    await this.queueManager.closeAllQueues();
    this.logger.log('Compute service closed');
  }
}
