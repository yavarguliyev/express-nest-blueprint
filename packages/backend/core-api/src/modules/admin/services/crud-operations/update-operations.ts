import { Job } from 'bullmq';

import { Injectable, NotFoundException, JwtPayload, parseId, QueueManager, BaseRepository, CrudTableOptions, CrudRepository } from '@config/libs';

@Injectable()
export class UpdateOperations {
  constructor (private readonly queueManager: QueueManager) {}

  async execute (
    repository: CrudRepository,
    metadata: CrudTableOptions,
    category: string,
    name: string,
    id: string | number,
    data: Record<string, unknown>,
    currentUser?: JwtPayload,
    bypassQueue = false,
    waitForJobCompletion?: (queueName: string, job: Job) => Promise<unknown>,
    invalidateCache?: (metadata: CrudTableOptions, id?: string | number) => Promise<void>
  ): Promise<unknown> {
    if (!repository.update) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);

    if (metadata.commandQueue && !bypassQueue && waitForJobCompletion && invalidateCache) {
      return this.executeWithQueue(metadata, id, data, currentUser, waitForJobCompletion, invalidateCache);
    }

    return this.executeDirectUpdate(repository, metadata, id, data, currentUser, invalidateCache);
  }

  private async executeWithQueue (
    metadata: CrudTableOptions,
    id: string | number,
    data: Record<string, unknown>,
    currentUser: JwtPayload | undefined,
    waitForJobCompletion: (queueName: string, job: Job) => Promise<unknown>,
    invalidateCache: (metadata: CrudTableOptions, id?: string | number) => Promise<void>
  ): Promise<unknown> {
    const jobName = metadata.operationMapping?.['update'] || `${metadata.name}.update`;
    const queue = this.queueManager.createQueue(metadata.commandQueue!);
    const job = await queue.add(jobName, { userId: id, data, currentUser });

    await waitForJobCompletion(metadata.commandQueue!, job);
    await invalidateCache(metadata, id);
    return { success: true, id };
  }

  private async executeDirectUpdate (
    repository: CrudRepository,
    metadata: CrudTableOptions,
    id: string | number,
    data: Record<string, unknown>,
    currentUser: JwtPayload | undefined,
    invalidateCache?: (metadata: CrudTableOptions, id?: string | number) => Promise<void>
  ): Promise<unknown> {
    const baseRepository = repository as BaseRepository<unknown>;
    const parsedId = parseId(id);
    const result = await baseRepository.update(parsedId, data, undefined, undefined, currentUser);

    if (invalidateCache) await invalidateCache(metadata, id);
    return result;
  }
}
