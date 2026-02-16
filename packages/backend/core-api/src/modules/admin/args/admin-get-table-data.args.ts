import { InputType, Field } from '@config/libs';

@InputType()
export class AdminGetTableDataArgs {
  @Field()
  category!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  page?: string;

  @Field({ nullable: true })
  limit?: string;

  @Field({ nullable: true })
  search?: string;

  @Field({ nullable: true })
  _t?: string;
}
