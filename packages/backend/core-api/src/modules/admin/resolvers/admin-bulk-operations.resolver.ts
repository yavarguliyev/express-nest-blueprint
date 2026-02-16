import {
  Injectable,
  Resolver,
  GqlQuery as Query,
  GqlMutation as Mutation,
  GqlArgs,
  Roles,
  UserRoles,
  GqlCurrentUser,
  JwtPayload,
  GraphQLJSONObject
} from '@config/libs';

import { AdminBulkOperationsService } from '@modules/admin/services/admin-bulk-operations.service';
import { AdminBulkExecuteArgs } from '@modules/admin/args/admin-bulk-execute.args';
import { AdminBulkValidateArgs } from '@modules/admin/args/admin-bulk-validate.args';

@Injectable()
@Resolver()
@Roles(UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN)
export class AdminBulkOperationsResolver {
  constructor (private readonly bulkOperationsService: AdminBulkOperationsService) {}

  @Mutation(() => GraphQLJSONObject)
  async adminExecuteBulk (@GqlArgs(() => AdminBulkExecuteArgs) args: AdminBulkExecuteArgs, @GqlCurrentUser() user: JwtPayload): Promise<unknown> {
    return this.bulkOperationsService.processBulkOperations(args.operations, user, args.wait);
  }

  @Mutation(() => GraphQLJSONObject)
  adminValidateBulk (@GqlArgs(() => AdminBulkValidateArgs) args: AdminBulkValidateArgs): unknown {
    return this.bulkOperationsService.validateOperations(args.operations);
  }

  @Query(() => GraphQLJSONObject)
  async adminCheckConflicts (@GqlArgs(() => AdminBulkValidateArgs) args: AdminBulkValidateArgs): Promise<unknown> {
    return this.bulkOperationsService.detectConflicts(args.operations);
  }
}
