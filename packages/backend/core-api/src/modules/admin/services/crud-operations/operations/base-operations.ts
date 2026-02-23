import { Injectable, BadRequestException, NotFoundException, QueueManager } from '@config/libs';

import {
  ExecuteOperationOptions,
  ExecuteQueueOperationOptions,
  OperationResult,
  QueueOperationParams
} from '@modules/admin/interfaces/admin-crud.interface';

@Injectable()
export abstract class BaseOperations {
  constructor (protected readonly queueManager: QueueManager) {}

  protected async executeOperation<ID = string | number, Data = unknown> (options: ExecuteOperationOptions<ID, Data>): Promise<OperationResult<ID>> {
    const { params, method, jobType } = options;
    const { repository, metadata, id, data, currentUser, bypassQueue = false, waitForJobCompletion, invalidateCache } = params;

    if (!method) throw new NotFoundException(`Table ${metadata.category}:${metadata.name} not found or unsupported`);

    const useQueue = metadata.commandQueue && bypassQueue;
    if (useQueue) {
      if (!currentUser || !waitForJobCompletion || !invalidateCache) {
        throw new BadRequestException(`Queued operation "${jobType}" requires currentUser, waitForJobCompletion, and invalidateCache to be defined.`);
      }

      const queueParams: QueueOperationParams<ID, Data> = {
        metadata,
        id,
        data,
        currentUser,
        waitForJobCompletion,
        invalidateCache
      };

      return this.executeWithQueue<ID, Data>({ params: queueParams, jobType });
    }

    await method(repository, id, data, currentUser);
    if (invalidateCache) await invalidateCache(metadata, id);

    return { success: true, id };
  }

  private async executeWithQueue<ID = string | number, Data = unknown> (
    options: ExecuteQueueOperationOptions<ID, Data>
  ): Promise<OperationResult<ID>> {
    const { params, jobType } = options;
    const { metadata, id, data, currentUser, waitForJobCompletion, invalidateCache } = params;

    if (!metadata.commandQueue) throw new BadRequestException('Queue name not defined in metadata');

    const queueName = metadata.commandQueue;
    const jobName = metadata.operationMapping?.[jobType] || `${metadata.name}.${jobType}`;
    const queue = this.queueManager.createQueue(queueName);
    const jobData: Record<string, unknown> = jobType === 'delete' ? { userId: id, currentUser } : { userId: id, data, currentUser };
    const job = await queue.add(jobName, jobData);

    await waitForJobCompletion(queueName, job);
    await invalidateCache(metadata, id);

    return { success: true, id };
  }
}
