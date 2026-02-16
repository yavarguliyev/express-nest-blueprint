import { InputType, Field } from '@config/libs';

@InputType()
export class CreateUserArgs {
  @Field(() => String)
  email!: string;

  @Field(() => String)
  password!: string;

  @Field(() => String, { nullable: true })
  firstName?: string | undefined;

  @Field(() => String, { nullable: true })
  lastName?: string | undefined;
}
