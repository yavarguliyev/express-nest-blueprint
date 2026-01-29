import { Worker, Job, QueueEvents } from 'bullmq';

import { BullMQService } from '../bullmq/services/bullmq.service';
import { QueueManager } from '../bullmq/services/queue-manager.service';
import { Logger } from '../logger/logger.service';
import { Container } from '../../core/container/container';
import { BULLMQ_OPTIONS, COMPUTE_MODULE_OPTIONS } from '../../core/decorators/bullmq.decorators';
import { Injectable, Inject } from '../../core/decorators/injectable.decorator';
import { BadRequestException, ServiceUnavailableException } from '../../domain/exceptions/http-exceptions';
import { getErrorMessage } from '../../domain/helpers/utility-functions.helper';
import {
  ComputeHandler,
  PendingJob,
  BullMQModuleOptions,
  ComputeModuleOptions,
  ComputeJobData,
  PatchedMethod,
  ComputeServiceStatus
} from '../../domain/interfaces/infra/bullmq.interface';
import { ComputeOptions } from '../../domain/interfaces/infra/infra-common.interface';
import { Constructor } from '../../domain/types/common/util.type';

@Injectable()
export class ComputeService {
  private readonly logger = new Logger(ComputeService.name);
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
        pending.reject(new Error(failedReason));
        this.pendingJobs.delete(jobId);
      }
    });

    if (this.moduleOptions.enableWorker === false) return;

    this.worker = new Worker(this.QUEUE_NAME, async (job: Job) => this.executeJob(job.data as ComputeJobData), {
      connection,
      concurrency: 10
    });

    this.worker.on('completed', (job: Job) => {
      void this.logger.log(`✅ Job ${job.id} completed successfully`);
    });
    this.worker.on('failed', (job: Job | undefined, err) => {
      void this.logger.error(`❌ Job ${job?.id} failed: ${getErrorMessage(err)}`);
    });
  }

  public registerHandler (taskName: string, handler: ComputeHandler): void {
    this.handlers.set(taskName, handler);
  }

  public patchMethod<T extends object> (instance: T, methodName: string, taskName: string, options: ComputeOptions = {}): void {
    const originalMethod = (instance as Record<string, unknown>)[methodName] as (...args: unknown[]) => Promise<unknown>;

    if (!originalMethod || typeof originalMethod !== 'function') throw new BadRequestException(`Method ${methodName} not found on instance`);

    const patchedMethod = async (...args: unknown[]): Promise<unknown> => {
      if (this.moduleOptions.enableApi === false) return originalMethod.apply(instance, args);

      try {
        const job = await this.bullMqService.addJob<ComputeJobData>(this.QUEUE_NAME, {
          taskName,
          args,
          timestamp: Date.now()
        });

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
      } catch {
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

  public getStatus (): ComputeServiceStatus {
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
    void this.logger.log('Compute service closed');
  }
}
