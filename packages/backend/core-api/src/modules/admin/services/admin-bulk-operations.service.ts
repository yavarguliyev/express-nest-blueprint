import { getErrorMessage, Injectable, InternalServerErrorException, DatabaseService, DatabaseOperation, BulkOperationResponse, OperationResult, ValidationResult, ValidationItem, ConflictItem, JwtPayload } from '@config/libs';

import { AdminCrudService } from '@modules/admin/services/admin-crud.service';

@Injectable()
export class AdminBulkOperationsService {
  constructor (
    private readonly adminCrudService: AdminCrudService,
    private readonly databaseService: DatabaseService
  ) {}

  async processBulkOperations (operations: DatabaseOperation[], user: JwtPayload): Promise<BulkOperationResponse> {
    if (operations.length === 0) {
      return { success: true, results: [], summary: { total: 0, successful: 0, failed: 0 } };
    }

    const database = this.databaseService.getWriteConnection();

    return database.transaction(async () => {
      const results: OperationResult[] = [];

      for (const operation of operations) {
        try {
          const result = await this.executeOperation(operation, user);
          results.push({ operation, success: true, data: result });
        } catch (error) {
          results.push({ operation, success: false, error: getErrorMessage(error) });
          throw error;
        }
      }

      return {
        success: true,
        results,
        summary: {
          total: operations.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length
        }
      };
    });
  }

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
      valid: validationResults.every((result) => result.valid),
      validationResults,
      conflicts
    };
  }

  async detectConflicts (operations: DatabaseOperation[]): Promise<{ conflicts: ConflictItem[] }> {
    const conflicts: ConflictItem[] = [];

    for (const operation of operations) {
      if (operation.type === 'update' || operation.type === 'delete') {
        try {
          const existingRecord = await this.adminCrudService.getTableRecord(operation.category, operation.table, operation.recordId!);

          if (!existingRecord) {
            conflicts.push({ recordId: operation.recordId!, table: operation.table, conflictType: 'constraint_violation', details: 'Record not found' });
          }
        } catch (error) {
          conflicts.push({ recordId: operation.recordId!, table: operation.table, conflictType: 'constraint_violation', details: getErrorMessage(error) });
        }
      }
    }

    return { conflicts };
  }

  private async executeOperation (operation: DatabaseOperation, user: JwtPayload): Promise<unknown> {
    switch (operation.type) {
      case 'create':
        return this.adminCrudService.createTableRecord(operation.category, operation.table, this.sanitizeData(operation.data!));
      case 'update':
        return this.adminCrudService.updateTableRecord(operation.category, operation.table, operation.recordId!, this.sanitizeData(operation.data!), user);
      case 'delete':
        return this.adminCrudService.deleteTableRecord(operation.category, operation.table, operation.recordId!, user);
      default: {
        const exhaustiveCheck: never = operation.type;
        throw new InternalServerErrorException(`Unsupported operation type: ${String(exhaustiveCheck)}`);
      }
    }
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
