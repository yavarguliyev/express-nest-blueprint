import { Injectable, Resolver, GqlQuery as Query, GqlMutation as Mutation, GqlArg as Arg, GqlArgs as Args, Roles, UserRoles } from '@config/libs';

import { UsersService } from '@modules/users/users.service';
import { User, UserList, DeleteResponse, CreateUserInput, UpdateUserInput, UsersArgs } from '@modules/users/graphql/user.types';

@Injectable()
@Resolver()
@Roles(UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN, UserRoles.MODERATOR, UserRoles.USER)
export class UsersResolver {
  constructor (private readonly usersService: UsersService) {}

  @Query(() => UserList)
  async users (@Args() query: UsersArgs): Promise<UserList> {
    return this.usersService.findAll(query);
  }

  @Query(() => User)
  async user (@Arg('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  async createUser (@Args() input: CreateUserInput): Promise<User | null> {
    return this.usersService.create({ ...input, isActive: true });
  }

  @Mutation(() => User)
  async updateUser (@Args() { id, ...data }: UpdateUserInput): Promise<User> {
    return this.usersService.update(id, data);
  }

  @Mutation(() => DeleteResponse)
  async deleteUser (@Arg('id') id: string): Promise<DeleteResponse> {
    return this.usersService.remove(id).then((res) => ({ ...res, success: true }));
  }
}
