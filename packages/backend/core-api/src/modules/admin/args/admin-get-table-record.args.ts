import { InputType, Field } from '@config/libs';

@InputType()
export class AdminGetTableRecordArgs {
  @Field()
  category!: string;

  @Field()
  name!: string;

  @Field()
  id!: string;
}
