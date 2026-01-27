import {
  ApiController,
  BaseController,
  Body,
  Get,
  Post,
  Query,
  UserRoles,
  Roles,
  CurrentUser,
  JwtPayload,
  BulkOperationRequest,
  BulkOperationResponse,
  ValidationResult,
  DatabaseOperation
} from '@config/libs';

import { AdminBulkOperationsService } from '@modules/admin/services/admin-bulk-operations.service';

@ApiController({ path: '/admin/bulk-operations' })
@Roles(UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN)
export class AdminBulkOperationsController extends BaseController {
  constructor (private readonly bulkOperationsService: AdminBulkOperationsService) {
    super({ path: '/admin/bulk-operations' });
  }

  @Post()
  async executeBulkOperations (@Body() request: BulkOperationRequest, @CurrentUser() user: JwtPayload): Promise<BulkOperationResponse> {
    return this.bulkOperationsService.processBulkOperations(request.operations, user);
  }

  @Post('validate')
  validateBulkOperations (@Body() request: BulkOperationRequest): ValidationResult {
    return this.bulkOperationsService.validateOperations(request.operations);
  }

  @Get('conflicts')
  async checkConflicts (@Query('operations') operations: string): Promise<{ conflicts: unknown[] }> {
    return this.bulkOperationsService.detectConflicts(JSON.parse(operations) as DatabaseOperation[]);
  }
}
