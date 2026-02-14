import {
  Injectable,
  Resolver,
  GqlQuery as Query,
  GqlMutation as Mutation,
  GqlArg as Arg,
  GqlArgs as Args,
  Roles,
  UserRoles,
  GqlCurrentUser as CurrentUser,
  JwtPayload,
  JobResponseDto
} from '@config/libs';

import { UsersService } from '@modules/users/users.service';
import { UsersArgs } from '@modules/users/args/users.args';
import { UpdateUserInput } from '@modules/users/args/update-user.args';
import { CreateUserInput } from '@modules/users/args/create-user.args';
import { DeleteResponse } from '@modules/users/args/delete-response.args';
import { UserList } from '@modules/users/args/user-list.args';
import { User } from '@modules/users/args/user.args';

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
  async createUser (@Args() input: CreateUserInput): Promise<JobResponseDto> {
    return this.usersService.create({ ...input, isActive: true });
  }

  @Mutation(() => User)
  async updateUser (@Args() { id, ...data }: UpdateUserInput, @CurrentUser() currentUser: JwtPayload): Promise<JobResponseDto> {
    return this.usersService.update(id, data, currentUser);
  }

  @Mutation(() => DeleteResponse)
  async deleteUser (@Arg('id') id: string, @CurrentUser() currentUser: JwtPayload): Promise<JobResponseDto> {
    return this.usersService.remove(id, currentUser);
  }
}
