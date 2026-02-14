import { InputType, Field } from '@config/libs';

@InputType()
export class UpdateUserInput {
  @Field(() => Number)
  id!: number;

  @Field(() => String, { nullable: true })
  email?: string | undefined;

  @Field(() => String, { nullable: true })
  firstName?: string | undefined;

  @Field(() => String, { nullable: true })
  lastName?: string | undefined;

  @Field(() => String, { nullable: true })
  role?: string | undefined;

  @Field(() => Boolean, { nullable: true })
  isActive?: boolean | undefined;

  @Field(() => Boolean, { nullable: true })
  isEmailVerified?: boolean | undefined;
}
