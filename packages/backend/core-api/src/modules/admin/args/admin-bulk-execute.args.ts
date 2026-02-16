import { InputType, Field, DatabaseOperation, GraphQLJSONObject } from '@config/libs';

@InputType()
export class AdminBulkExecuteArgs {
  @Field(() => [GraphQLJSONObject])
  operations!: DatabaseOperation[];

  @Field({ nullable: true })
  wait?: boolean;
}
