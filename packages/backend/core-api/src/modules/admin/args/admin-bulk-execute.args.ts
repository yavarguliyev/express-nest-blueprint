import { InputType, Field, GraphQLJSONObject, DatabaseOperation } from '@config/libs';

@InputType()
export class AdminBulkExecuteArgs {
  @Field(() => [GraphQLJSONObject])
  operations!: DatabaseOperation[];

  @Field({ nullable: true })
  wait?: boolean;
}
