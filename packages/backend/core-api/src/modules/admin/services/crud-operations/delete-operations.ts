import { Job } from 'bullmq';

import { Injectable, NotFoundException, JwtPayload, parseId, QueueManager, BaseRepository, CrudTableOptions, CrudRepository } from '@config/libs';

@Injectable()
export class DeleteOperations {
  constructor (private readonly queueManager: QueueManager) {}

  async execute (
    repository: CrudRepository,
    metadata: CrudTableOptions,
    category: string,
    name: string,
    id: string | number,
    currentUser?: JwtPayload,
    bypassQueue = false,
    waitForJobCompletion?: (queueName: string, job: Job) => Promise<unknown>,
    invalidateCache?: (metadata: CrudTableOptions, id?: string | number) => Promise<void>
  ): Promise<{ success: boolean }> {
    if (!repository.delete) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);

    if (metadata.commandQueue && !bypassQueue && waitForJobCompletion && invalidateCache) {
      return this.executeWithQueue(metadata, id, currentUser, waitForJobCompletion, invalidateCache);
    }

    return this.executeDirectDelete(repository, metadata, id, currentUser, invalidateCache);
  }

  private async executeWithQueue (
    metadata: CrudTableOptions,
    id: string | number,
    currentUser: JwtPayload | undefined,
    waitForJobCompletion: (queueName: string, job: Job) => Promise<unknown>,
    invalidateCache: (metadata: CrudTableOptions, id?: string | number) => Promise<void>
  ): Promise<{ success: boolean }> {
    const jobName = metadata.operationMapping?.['delete'] || `${metadata.name}.delete`;
    const queue = this.queueManager.createQueue(metadata.commandQueue!);
    const job = await queue.add(jobName, { userId: id, currentUser });

    await waitForJobCompletion(metadata.commandQueue!, job);
    await invalidateCache(metadata, id);

    return { success: true };
  }

  private async executeDirectDelete (
    repository: CrudRepository,
    metadata: CrudTableOptions,
    id: string | number,
    currentUser: JwtPayload | undefined,
    invalidateCache?: (metadata: CrudTableOptions, id?: string | number) => Promise<void>
  ): Promise<{ success: boolean }> {
    const baseRepository = repository as BaseRepository<unknown>;
    const parsedId = parseId(id);
    const success = await baseRepository.delete(parsedId, undefined, currentUser);
    if (success && invalidateCache) await invalidateCache(metadata, id);

    return { success };
  }
}
