import { InputType, Field, SortBy, SortOrder } from '@config/libs';

@InputType()
export class UsersArgs {
  @Field(() => Number, { nullable: true })
  page?: number | undefined;

  @Field(() => Number, { nullable: true })
  limit?: number | undefined;

  @Field(() => String, { nullable: true })
  search?: string | undefined;

  @Field(() => String, { nullable: true })
  sortBy?: SortBy | undefined;

  @Field(() => String, { nullable: true })
  sortOrder?: SortOrder | undefined;

  @Field(() => String, { nullable: true })
  email?: string | undefined;

  @Field(() => String, { nullable: true })
  firstName?: string | undefined;

  @Field(() => String, { nullable: true })
  lastName?: string | undefined;

  @Field(() => String, { nullable: true })
  name?: string | undefined;

  @Field(() => Boolean, { nullable: true })
  isActive?: boolean | undefined;
}
