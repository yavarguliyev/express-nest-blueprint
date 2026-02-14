import { Job, QueueEvents } from 'bullmq';
import {
  getErrorMessage,
  Injectable,
  DatabaseOperation,
  BulkOperationResponse,
  ValidationResult,
  ValidationItem,
  ConflictItem,
  JwtPayload,
  QueueManager,
  RedisService
} from '@config/libs';

import { AdminCrudService } from '@modules/admin/services/admin-crud.service';

@Injectable()
export class AdminBulkOperationsService {
  private queueEventsMap = new Map<string, QueueEvents>();

  constructor (
    private readonly adminCrudService: AdminCrudService,
    private readonly queueManager: QueueManager,
    private readonly redisService: RedisService
  ) {}

  validateOperations (operations: DatabaseOperation[]): ValidationResult {
    const validationResults: ValidationItem[] = [];
    const conflicts: ConflictItem[] = [];

    for (const operation of operations) {
      try {
        const warnings: string[] = [];

        if (operation.type === 'update' && !operation.recordId) {
          validationResults.push({ operation, valid: false, warnings: ['Record ID is required for update operations'] });
          continue;
        }

        if (operation.type === 'delete' && !operation.recordId) {
          validationResults.push({ operation, valid: false, warnings: ['Record ID is required for delete operations'] });
          continue;
        }

        if (operation.type === 'create' && !operation.data) {
          validationResults.push({ operation, valid: false, warnings: ['Data is required for create operations'] });
          continue;
        }

        if (operation.type === 'update' && !operation.data) {
          validationResults.push({ operation, valid: false, warnings: ['Data is required for update operations'] });
          continue;
        }

        validationResults.push({ operation, valid: true, warnings });
      } catch (error) {
        validationResults.push({ operation, valid: false, warnings: [getErrorMessage(error)] });
      }
    }

    return {
      valid: validationResults.every(result => result.valid),
      validationResults,
      conflicts
    };
  }

  async processBulkOperations (operations: DatabaseOperation[], user: JwtPayload, wait = false): Promise<BulkOperationResponse> {
    if (operations.length === 0) return { success: true, results: [], summary: { total: 0, successful: 0, failed: 0 } };

    const sanitizedOperations = operations.map(op => ({
      ...op,
      data: op.data ? this.sanitizeData(op.data) : undefined
    }));

    const queue = this.queueManager.createQueue('admin-commands');
    const job = await queue.add('admin.bulk.execute', { operations: sanitizedOperations, user });

    if (wait) return (await this.waitForJobCompletion('admin-commands', job)) as BulkOperationResponse;

    const response: BulkOperationResponse = {
      success: true,
      results: [],
      summary: {
        total: operations.length,
        successful: 0,
        failed: 0
      }
    };

    if (job.id) response.jobId = job.id;
    return response;
  }

  async detectConflicts (operations: DatabaseOperation[]): Promise<{ conflicts: ConflictItem[] }> {
    const conflicts: ConflictItem[] = [];

    for (const operation of operations) {
      if (operation.type === 'update' || operation.type === 'delete') {
        try {
          const existingRecord = await this.adminCrudService.getTableRecord(operation.category, operation.table, operation.recordId!);

          if (!existingRecord) {
            conflicts.push({
              recordId: operation.recordId!,
              table: operation.table,
              conflictType: 'constraint_violation',
              details: 'Record not found'
            });
          }
        } catch (error) {
          conflicts.push({
            recordId: operation.recordId!,
            table: operation.table,
            conflictType: 'constraint_violation',
            details: getErrorMessage(error)
          });
        }
      }
    }

    return { conflicts };
  }

  private async waitForJobCompletion (queueName: string, job: Job): Promise<unknown> {
    const queueNameWithHash = queueName.startsWith('{') ? queueName : `{${queueName}}`;

    let queueEvents = this.queueEventsMap.get(queueNameWithHash);
    if (!queueEvents) {
      queueEvents = new QueueEvents(queueNameWithHash, { connection: this.redisService.getClient() });
      this.queueEventsMap.set(queueNameWithHash, queueEvents);
    }

    return await job.waitUntilFinished(queueEvents, 60000);
  }

  private sanitizeData (data: Record<string, unknown>): Record<string, unknown> {
    const sanitizedData = { ...data };

    if ('updated_at' in sanitizedData) delete sanitizedData['updated_at'];
    if ('updatedAt' in sanitizedData) delete sanitizedData['updatedAt'];
    if ('created_at' in sanitizedData) delete sanitizedData['created_at'];
    if ('createdAt' in sanitizedData) delete sanitizedData['createdAt'];

    return sanitizedData;
  }
}
