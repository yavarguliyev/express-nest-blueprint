import { ObjectType, Field } from '@config/libs';

@ObjectType()
export class DeleteResponseArgs {
  @Field(() => String)
  message!: string;

  @Field(() => Boolean)
  success!: boolean;
}
