import { BULLMQ_PROCESSOR_METADATA, BULLMQ_JOB_HANDLER_METADATA, BULLMQ_PROCESSOR_REGISTRY } from '../../domain/constants/infra/bullmq.const';
import { Constructor } from '../../domain/types/common/util.type';
import { JobHandlerOptions, QueueMetadata } from '../../domain/interfaces/infra/bullmq.interface';

export const QUEUE_NAME_METADA = '{compute-queue}';
export const QUEUE_METADATA = 'bullmq:queue';
export const INJECT_QUEUE_METADATA = 'bullmq:inject-queue';

export const BULLMQ_OPTIONS = Symbol('BULLMQ_OPTIONS');
export const QUEUE_MANAGER_TOKEN = Symbol('QUEUE_MANAGER');
export const WORKER_MANAGER_TOKEN = Symbol('WORKER_MANAGER');
export const BULLMQ_SERVICE_TOKEN = Symbol('BULLMQ_SERVICE');
export const STORAGE_OPTIONS = Symbol('STORAGE_OPTIONS');
export const COMPUTE_MODULE_OPTIONS = Symbol('COMPUTE_MODULE_OPTIONS');

export const Processor = (queueName: string): ClassDecorator => {
  return (target: object): void => {
    Reflect.defineMetadata(BULLMQ_PROCESSOR_METADATA, queueName, target);
    BULLMQ_PROCESSOR_REGISTRY.push(target as Constructor);
  };
};

export const OnJob = (jobName: string, options?: JobHandlerOptions): MethodDecorator => {
  return (target: object, propertyKey: string | symbol): void => {
    const existingHandlers = (Reflect.getMetadata(BULLMQ_JOB_HANDLER_METADATA, target.constructor) || []) as unknown[];
    existingHandlers.push({ methodName: propertyKey, jobName, options });
    Reflect.defineMetadata(BULLMQ_JOB_HANDLER_METADATA, existingHandlers, target.constructor);
  };
};

export const InjectQueue = (queueName: string): ParameterDecorator => {
  return (target: object, _propertyKey: string | symbol | undefined, parameterIndex: number): void => {
    const existingQueues = (Reflect.getMetadata(INJECT_QUEUE_METADATA, target) ?? []) as unknown[];
    existingQueues[parameterIndex] = queueName;
    Reflect.defineMetadata(INJECT_QUEUE_METADATA, existingQueues, target);
  };
};

export const QueueProcessor = (metadata: QueueMetadata): ClassDecorator => {
  return (target: object): void => Reflect.defineMetadata(QUEUE_METADATA, metadata, target);
};
