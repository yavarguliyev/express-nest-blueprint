import { Job } from 'bullmq';
import {
  Injectable,
  Processor,
  OnJob,
  DatabaseOperation,
  BulkOperationResponse,
  getErrorMessage,
  OperationResult,
  BadRequestException,
  BulkOperationRequestWithUser
} from '@config/libs';

import { AdminCrudService } from '@modules/admin/services/admin-crud.service';
import { TableOperationBase } from '@modules/admin/interfaces/admin.interface';

@Injectable()
@Processor('admin-commands')
export class AdminCommandsWorker {
  constructor (private readonly adminCrudService: AdminCrudService) {}

  private resolveRecordId (operation: DatabaseOperation): string | number {
    if (typeof operation.recordId === 'number' || typeof operation.recordId === 'string') return operation.recordId;
    throw new BadRequestException(`Operation "${operation.type}" requires a valid recordId`);
  }

  private resolveUpdateData (operation: DatabaseOperation): Record<string, unknown> {
    if (!operation.data || typeof operation.data !== 'object' || Array.isArray(operation.data)) {
      throw new BadRequestException('Update operation requires a valid object payload');
    }

    return operation.data;
  }

  @OnJob('admin.bulk.execute')
  async handleBulkExecute (job: Job<BulkOperationRequestWithUser>): Promise<BulkOperationResponse> {
    const { operations, user } = job.data;

    const baseParams = (op: DatabaseOperation): TableOperationBase => ({
      category: op.category,
      name: op.table,
      currentUser: user,
      bypassQueue: true
    });

    const handlers: Record<string, (op: DatabaseOperation) => Promise<unknown>> = {
      create: op => this.adminCrudService.createTableRecord({ ...baseParams(op), data: op.data }),
      update: op => this.adminCrudService.updateTableRecord({ ...baseParams(op), id: this.resolveRecordId(op), data: this.resolveUpdateData(op) }),
      delete: op => this.adminCrudService.deleteTableRecord({ ...baseParams(op), id: this.resolveRecordId(op) })
    };

    const results: OperationResult[] = [];

    for (const operation of operations) {
      try {
        const handler = handlers[operation.type];
        if (!handler) throw new BadRequestException(`Unsupported operation type: ${operation.type}`);
        const result: unknown = await handler(operation);
        results.push({ operation, success: true, data: result });
      } catch (error: unknown) {
        results.push({ operation, success: false, error: getErrorMessage(error) });
      }
    }

    return {
      success: true,
      results,
      summary: {
        total: operations.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };
  }
}
