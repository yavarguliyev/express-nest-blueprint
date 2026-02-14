import { ObjectType, Field } from '@config/libs';
import { PaginationInfo } from './pagination-info.input';
import { User } from './user.args';

@ObjectType()
export class UserList {
  @Field(() => [User])
  data!: User[];

  @Field(() => PaginationInfo)
  pagination!: PaginationInfo;
}
