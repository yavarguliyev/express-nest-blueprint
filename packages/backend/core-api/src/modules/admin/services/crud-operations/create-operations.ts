import { Job } from 'bullmq';

import { Injectable, NotFoundException, JwtPayload, QueueManager, CrudTableOptions, CrudRepository } from '@config/libs';

@Injectable()
export class CreateOperations {
  constructor (private readonly queueManager: QueueManager) {}

  async execute (
    repository: CrudRepository,
    metadata: CrudTableOptions,
    category: string,
    name: string,
    data: unknown,
    currentUser?: JwtPayload,
    bypassQueue = false,
    waitForJobCompletion?: (queueName: string, job: Job) => Promise<unknown>,
    invalidateCache?: (metadata: CrudTableOptions, id?: string | number) => Promise<void>
  ): Promise<unknown> {
    if (!repository.create) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);

    if (metadata.commandQueue && !bypassQueue && waitForJobCompletion && invalidateCache) {
      return this.executeWithQueue(metadata, data, currentUser, waitForJobCompletion, invalidateCache);
    }

    const result = (await repository.create(data)) as { id?: string | number; userId?: string | number };
    if (invalidateCache) await invalidateCache(metadata, result?.id || result?.userId);
    return result;
  }

  private async executeWithQueue (
    metadata: CrudTableOptions,
    data: unknown,
    currentUser: JwtPayload | undefined,
    waitForJobCompletion: (queueName: string, job: Job) => Promise<unknown>,
    invalidateCache: (metadata: CrudTableOptions, id?: string | number) => Promise<void>
  ): Promise<unknown> {
    const jobName = metadata.operationMapping?.['create'] || `${metadata.name}.create`;
    const queue = this.queueManager.createQueue(metadata.commandQueue!);
    const job = await queue.add(jobName, { data, currentUser });

    const result = (await waitForJobCompletion(metadata.commandQueue!, job)) as {
      id: number;
      userId: number;
    };

    await invalidateCache(metadata, result?.id || result?.userId);
    return result;
  }
}
