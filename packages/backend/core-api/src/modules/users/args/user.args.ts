import { ObjectType, Field } from '@config/libs';

@ObjectType()
export class User {
  @Field(() => Number)
  id?: number | undefined;

  @Field(() => String)
  email?: string | undefined;

  @Field(() => String, { nullable: true })
  firstName?: string | null | undefined;

  @Field(() => String, { nullable: true })
  lastName?: string | null | undefined;

  @Field(() => String)
  role?: string | undefined;

  @Field(() => Boolean)
  isActive?: boolean | undefined;

  @Field(() => Boolean)
  isEmailVerified?: boolean | undefined;

  @Field(() => String, { nullable: true })
  profileImageUrl?: string | null | undefined;

  @Field(() => String)
  createdAt?: string | Date | undefined;

  @Field(() => String)
  updatedAt?: string | Date | undefined;
}
