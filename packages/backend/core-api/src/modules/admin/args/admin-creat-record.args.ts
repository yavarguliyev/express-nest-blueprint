import { InputType, Field, GraphQLJSONObject } from '@config/libs';

@InputType()
export class AdminCreateRecordArgs {
  @Field()
  category!: string;

  @Field()
  name!: string;

  @Field(() => GraphQLJSONObject)
  data!: Record<string, unknown>;
}
