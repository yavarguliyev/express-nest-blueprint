import { Job } from 'bullmq';
import { Injectable, Processor, OnJob, DatabaseOperation, BulkOperationResponse, getErrorMessage, JwtPayload, OperationResult } from '@config/libs';

import { AdminCrudService } from '@modules/admin/services/admin-crud.service';

@Injectable()
@Processor('admin-commands')
export class AdminCommandsWorker {
  constructor (private readonly adminCrudService: AdminCrudService) {}

  @OnJob('admin.bulk.execute')
  async handleBulkExecute (job: Job<{ operations: DatabaseOperation[]; user: JwtPayload }>): Promise<BulkOperationResponse> {
    const { operations, user } = job.data;

    const results: OperationResult[] = [];

    for (const operation of operations) {
      try {
        let result: unknown;

        switch (operation.type) {
          case 'create':
            result = await this.adminCrudService.createTableRecord(operation.category, operation.table, operation.data!, user, true);
            break;
          case 'update':
            result = await this.adminCrudService.updateTableRecord(
              operation.category,
              operation.table,
              operation.recordId!,
              operation.data!,
              user,
              true
            );
            break;
          case 'delete':
            result = await this.adminCrudService.deleteTableRecord(operation.category, operation.table, operation.recordId!, user, true);
            break;
        }

        results.push({ operation, success: true, data: result });
      } catch (error) {
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
