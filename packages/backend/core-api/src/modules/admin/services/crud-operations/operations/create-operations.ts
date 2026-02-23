import { Injectable, NotFoundException, QueueManager } from '@config/libs';

import { BaseOperationParams, OperationResult } from '@modules/admin/interfaces/admin-crud.interface';
import { BaseOperations } from '@modules/admin/services/crud-operations/operations/base-operations';

@Injectable()
export class CreateOperations extends BaseOperations {
  constructor (queueManager: QueueManager) {
    super(queueManager);
  }

  async execute<ID extends string | number = string | number, Data = unknown> (params: BaseOperationParams<ID, Data>): Promise<OperationResult<ID>> {
    const { repository, metadata } = params;

    if (!repository.create) throw new NotFoundException(`Table ${metadata.category}:${metadata.name} not found or unsupported`);

    return this.executeOperation<ID, Data>({
      params,
      jobType: 'create',
      method: async (repository, _id, data) => {
        if (!repository.create) throw new NotFoundException(`Table ${metadata.category}:${metadata.name} not found or unsupported`);
        if (data === undefined) throw new NotFoundException(`Create data missing for ${metadata.category}:${metadata.name}`);
        await repository.create(data);
      }
    });
  }
}
