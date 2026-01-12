
import { JobHandlerOptions, QueueMetadata } from '@common/interfaces';

export const QUEUE_METADATA = 'bullmq:queue';
export const PROCESSOR_METADATA = 'bullmq:processor';
export const JOB_HANDLER_METADATA = 'bullmq:job-handler';
export const INJECT_QUEUE_METADATA = 'bullmq:inject-queue';

export const BULLMQ_OPTIONS = Symbol('BULLMQ_OPTIONS');
export const QUEUE_MANAGER_TOKEN = Symbol('QUEUE_MANAGER');
export const WORKER_MANAGER_TOKEN = Symbol('WORKER_MANAGER');
export const BULLMQ_SERVICE_TOKEN = Symbol('BULLMQ_SERVICE');
export const STORAGE_OPTIONS = Symbol('STORAGE_OPTIONS');
export const COMPUTE_MODULE_OPTIONS = Symbol('COMPUTE_MODULE_OPTIONS');

export const Processor = (queueName: string) => {
  return (target: object) => {
    Reflect.defineMetadata(PROCESSOR_METADATA, queueName, target);
  };
};

export const OnJob = (jobName: string, options?: JobHandlerOptions) => {
  return (target: object, propertyKey: string) => {
    const existingHandlers = (Reflect.getMetadata(JOB_HANDLER_METADATA, target.constructor) || []) as unknown[];
    existingHandlers.push({ methodName: propertyKey, jobName, options });
    Reflect.defineMetadata(JOB_HANDLER_METADATA, existingHandlers, target.constructor);
  };
};

export const InjectQueue = (queueName: string) => {
  return (target: object, _: string | symbol | undefined, parameterIndex: number) => {
    const existingQueues = (Reflect.getMetadata(INJECT_QUEUE_METADATA, target) || []) as unknown[];
    existingQueues[parameterIndex] = queueName;
    Reflect.defineMetadata(INJECT_QUEUE_METADATA, existingQueues, target);
  };
};

export const QueueProcessor = (metadata: QueueMetadata) => {
  return (target: object) => {
    Reflect.defineMetadata(QUEUE_METADATA, metadata, target);
  };
};
