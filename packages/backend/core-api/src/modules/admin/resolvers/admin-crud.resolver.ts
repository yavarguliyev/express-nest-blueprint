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

import { AdminCrudService } from '@modules/admin/services/admin-crud.service';
import { AdminGetTableDataArgs } from '@modules/admin/args/admin-get-table-data.args';
import { AdminDeleteRecordArgs } from '@modules/admin/args/admin-delete-record.args';
import { AdminUpdateRecordArgs } from '@modules/admin/args/admin-update-record.args';
import { AdminCreateRecordArgs } from '@modules/admin/args/admin-creat-record.args';
import { AdminGetTableRecordArgs } from '@modules/admin/args/admin-get-table-record.args';

@Injectable()
@Resolver()
@Roles(UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN)
export class AdminCrudResolver {
  constructor (private readonly adminCrudService: AdminCrudService) {}

  @Query(() => GraphQLJSONObject)
  adminGetSchema (): Record<string, unknown> {
    return this.adminCrudService.getTableSchema() as Record<string, unknown>;
  }

  @Query(() => GraphQLJSONObject)
  async adminGetTableData (@GqlArgs(() => AdminGetTableDataArgs) args: AdminGetTableDataArgs): Promise<unknown> {
    return this.adminCrudService.getTableData(args.category, args.name, args.page, args.limit, args.search);
  }

  @Query(() => GraphQLJSONObject)
  async adminGetTableRecord (@GqlArgs(() => AdminGetTableRecordArgs) args: AdminGetTableRecordArgs): Promise<unknown> {
    return this.adminCrudService.getTableRecord(args.category, args.name, args.id);
  }

  @Mutation(() => GraphQLJSONObject)
  async adminCreateRecord (@GqlArgs(() => AdminCreateRecordArgs) args: AdminCreateRecordArgs, @GqlCurrentUser() user: JwtPayload): Promise<unknown> {
    return this.adminCrudService.createTableRecord(args.category, args.name, args.data, user);
  }

  @Mutation(() => GraphQLJSONObject)
  async adminUpdateRecord (@GqlArgs(() => AdminUpdateRecordArgs) args: AdminUpdateRecordArgs, @GqlCurrentUser() user: JwtPayload): Promise<unknown> {
    return this.adminCrudService.updateTableRecord(args.category, args.name, args.id, args.data, user);
  }

  @Mutation(() => GraphQLJSONObject)
  async adminDeleteRecord (
    @GqlArgs(() => AdminDeleteRecordArgs) args: AdminDeleteRecordArgs,
    @GqlCurrentUser() user: JwtPayload
  ): Promise<{ success: boolean }> {
    return this.adminCrudService.deleteTableRecord(args.category, args.name, args.id, user);
  }
}
