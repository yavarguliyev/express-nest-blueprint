import {
  BaseController,
  Body,
  Get,
  Post,
  Query,
  Roles,
  CurrentUser,
  ApiController,
  UserRoles,
  JwtPayload,
  BulkOperationRequest,
  BulkOperationResponse,
  ValidationResult,
  BadRequestException,
  DatabaseOperation
} from '@config/libs';

import { AdminBulkOperationsService } from '@modules/admin/services/admin-bulk-operations.service';

@ApiController({ path: '/admin/bulk-operations' })
@Roles(UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN)
export class AdminBulkOperationsController extends BaseController {
  constructor (private readonly bulkOperationsService: AdminBulkOperationsService) {
    super({ path: '/admin/bulk-operations' });
  }

  private isDatabaseOperation (value: unknown): value is DatabaseOperation {
    if (!value || typeof value !== 'object') return false;
    return 'type' in value && 'category' in value && 'table' in value;
  }

  @Post()
  async executeBulkOperations (
    @Body() request: BulkOperationRequest,
    @CurrentUser() user: JwtPayload,
    @Query('wait') wait?: string
  ): Promise<BulkOperationResponse> {
    return this.bulkOperationsService.processBulkOperations({ operations: request.operations, user, wait: wait === 'true' || wait === '1' });
  }

  @Post('validate')
  validateBulkOperations (@Body() request: BulkOperationRequest): ValidationResult {
    return this.bulkOperationsService.validateOperations({ operations: request.operations });
  }

  @Get('conflicts')
  async checkConflicts (@Query('operations') operations: string): Promise<{ conflicts: unknown[] }> {
    let parsedOperations: unknown;
    try {
      parsedOperations = JSON.parse(operations);
    } catch {
      throw new BadRequestException('Invalid operations payload');
    }

    if (!Array.isArray(parsedOperations)) throw new BadRequestException('Operations payload must be an array');
    if (!parsedOperations.every(operation => this.isDatabaseOperation(operation))) throw new BadRequestException('Invalid operation payload');

    return this.bulkOperationsService.detectConflicts({ operations: parsedOperations });
  }
}
