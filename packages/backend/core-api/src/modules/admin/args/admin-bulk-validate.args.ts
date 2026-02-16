import { InputType, Field, GraphQLJSONObject, DatabaseOperation } from '@config/libs';

@InputType()
export class AdminBulkValidateArgs {
  @Field(() => [GraphQLJSONObject])
  operations!: DatabaseOperation[];
}
