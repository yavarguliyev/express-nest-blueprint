import { InputType, Field, GraphQLJSONObject } from '@config/libs';

import { AdminGetTableRecordArgs } from '@modules/admin/args/admin-get-table-record.args';

@InputType()
export class AdminUpdateRecordArgs extends AdminGetTableRecordArgs {
  @Field(() => GraphQLJSONObject)
  data!: Record<string, unknown>;
}
