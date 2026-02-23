import { Injectable, NotFoundException, QueueManager } from '@config/libs';

import { BaseOperations } from '@modules/admin/services/crud-operations/operations/base-operations';
import { BaseOperationParams, OperationResult } from '@modules/admin/interfaces/admin-crud.interface';

@Injectable()
export class DeleteOperations extends BaseOperations {
  constructor (queueManager: QueueManager) {
    super(queueManager);
  }

  async execute<ID extends string | number = string | number, Data = unknown> (params: BaseOperationParams<ID, Data>): Promise<OperationResult<ID>> {
    const { repository, metadata } = params;

    if (!repository.delete) throw new NotFoundException(`Table ${metadata.category}:${metadata.name} not found or unsupported`);

    return this.executeOperation<ID, Data>({
      params,
      jobType: 'delete',
      method: async (repository, recordId) => {
        if (!repository.delete) throw new NotFoundException(`Table ${metadata.category}:${metadata.name} not found or unsupported`);
        if (recordId === undefined) throw new NotFoundException(`Delete id missing for ${metadata.category}:${metadata.name}`);
        await repository.delete(recordId);
      }
    });
  }
}
