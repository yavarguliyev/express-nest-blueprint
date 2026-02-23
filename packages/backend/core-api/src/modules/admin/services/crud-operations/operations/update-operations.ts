import { Injectable, NotFoundException, QueueManager } from '@config/libs';

import { BaseOperationParams, OperationResult } from '@modules/admin/interfaces/admin-crud.interface';
import { BaseOperations } from '@modules/admin/services/crud-operations/operations/base-operations';

@Injectable()
export class UpdateOperations extends BaseOperations {
  constructor (queueManager: QueueManager) {
    super(queueManager);
  }

  async execute<ID extends string | number = string | number, Data = Record<string, unknown>> (
    params: BaseOperationParams<ID, Data>
  ): Promise<OperationResult<ID>> {
    const { repository, metadata } = params;

    if (!repository.update) throw new NotFoundException(`Table ${metadata.category}:${metadata.name} not found or unsupported`);

    return this.executeOperation<ID, Data>({
      params,
      jobType: 'update',
      method: async (repository, id, data) => {
        if (!repository.update) throw new NotFoundException(`Table ${metadata.category}:${metadata.name} not found or unsupported`);
        if (id === undefined || data === undefined) throw new NotFoundException(`Update payload missing for ${metadata.category}:${metadata.name}`);
        await repository.update(id, data);
      }
    });
  }
}
