import { Job, QueueEvents } from 'bullmq';
import {
  Injectable,
  getErrorMessage,
  DatabaseOperation,
  BulkOperationResponse,
  ValidationResult,
  ValidationItem,
  ConflictItem,
  QueueManager,
  RedisService,
  isBulkOperationResponse,
  sanitizeOperationData
} from '@config/libs';

import { AdminCrudService } from '@modules/admin/services/admin-crud.service';
import { ConflictDetectionResult } from '@modules/admin/interfaces/admin.interface';
import {
  DetectConflictsParams,
  ProcessBulkOperationsParams,
  ValidateOperationsParams
} from '@modules/admin/interfaces/admin-bulk-operations.interface';

@Injectable()
export class AdminBulkOperationsService {
  private queueEventsMap = new Map<string, QueueEvents>();

  constructor (
    private readonly adminCrudService: AdminCrudService,
    private readonly queueManager: QueueManager,
    private readonly redisService: RedisService
  ) {}

  validateOperations (params: ValidateOperationsParams): ValidationResult {
    const { operations } = params;
    const conflicts: ConflictItem[] = [];

    const requirements: Record<string, (keyof DatabaseOperation)[]> = {
      create: ['data'],
      update: ['recordId', 'data'],
      delete: ['recordId']
    };

    const validationResults: ValidationItem[] = operations.map(operation => {
      try {
        const warnings =
          requirements[operation.type]
            ?.filter(field => !operation[field])
            .map(field => `${field === 'recordId' ? 'Record ID' : 'Data'} is required for ${operation.type} operations`) ?? [];

        return { operation, valid: warnings.length === 0, warnings };
      } catch (error) {
        return { operation, valid: false, warnings: [getErrorMessage(error)] };
      }
    });

    return {
      valid: validationResults.every(r => r.valid),
      validationResults,
      conflicts
    };
  }

  async processBulkOperations (params: ProcessBulkOperationsParams): Promise<BulkOperationResponse> {
    const { operations, user, wait = false } = params;
    if (operations.length === 0) return { success: true, results: [], summary: { total: 0, successful: 0, failed: 0 } };

    const sanitizedOperations = operations.map(op => ({
      ...op,
      data: op.data ? sanitizeOperationData(op.data) : undefined
    }));

    const queue = this.queueManager.createQueue('admin-commands');
    const job = await queue.add('admin.bulk.execute', { operations: sanitizedOperations, user });

    if (wait) {
      const result = await this.waitForJobCompletion('admin-commands', job);
      if (!isBulkOperationResponse(result)) throw new Error('Unexpected bulk operation response');
      return result;
    }

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

  async detectConflicts (params: DetectConflictsParams): Promise<ConflictDetectionResult> {
    const { operations } = params;
    const conflicts: ConflictItem[] = [];

    for (const operation of operations) {
      if (typeof operation.recordId !== 'string' && typeof operation.recordId !== 'number') continue;

      if (operation.type === 'update' || operation.type === 'delete') {
        try {
          const existingRecord = await this.adminCrudService.getTableRecord({
            category: operation.category,
            name: operation.table,
            id: operation.recordId
          });

          if (!existingRecord) {
            conflicts.push({
              recordId: operation.recordId,
              table: operation.table,
              conflictType: 'constraint_violation',
              details: 'Record not found'
            });
          }
        } catch (error) {
          conflicts.push({
            recordId: operation.recordId,
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
}
