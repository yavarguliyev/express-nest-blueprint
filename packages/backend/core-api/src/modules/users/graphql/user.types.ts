import { ObjectType, InputType, Field, SortBy, SortOrder } from '@config/libs';

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

@ObjectType()
export class PaginationInfo {
  @Field(() => Number)
  total!: number;

  @Field(() => Number)
  page!: number;

  @Field(() => Number)
  limit!: number;

  @Field(() => Number)
  totalPages!: number;
}

@ObjectType()
export class UserList {
  @Field(() => [User])
  data!: User[];

  @Field(() => PaginationInfo)
  pagination!: PaginationInfo;
}

@ObjectType()
export class DeleteResponse {
  @Field(() => String)
  message!: string;

  @Field(() => Boolean)
  success!: boolean;
}

@InputType()
export class CreateUserInput {
  @Field(() => String)
  email!: string;

  @Field(() => String)
  password!: string;

  @Field(() => String, { nullable: true })
  firstName?: string | undefined;

  @Field(() => String, { nullable: true })
  lastName?: string | undefined;
}

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
