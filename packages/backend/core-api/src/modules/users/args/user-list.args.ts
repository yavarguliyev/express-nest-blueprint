import { ObjectType, Field } from '@config/libs';

import { PaginationArgs } from '@modules/users/args/pagination-info.args';
import { UserArgs } from '@modules/users/args/user.args';

@ObjectType()
export class UserListArgs {
  @Field(() => [UserArgs])
  data!: UserArgs[];

  @Field(() => PaginationArgs)
  pagination!: PaginationArgs;
}
