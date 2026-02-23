import {
  Injectable,
  Resolver,
  GqlQuery as Query,
  GqlMutation as Mutation,
  GqlArg as Arg,
  GqlArgs as Args,
  Roles,
  GqlCurrentUser as CurrentUser,
  UserRoles,
  JwtPayload,
  JobResponseDto
} from '@config/libs';

import { UsersService } from '@modules/users/users.service';
import { UsersArgs } from '@modules/users/args/users.args';
import { UpdateUserArgs } from '@modules/users/args/update-user.args';
import { CreateUserArgs } from '@modules/users/args/create-user.args';
import { DeleteResponseArgs } from '@modules/users/args/delete-response.args';
import { UserListArgs } from '@modules/users/args/user-list.args';
import { UserArgs } from '@modules/users/args/user.args';

@Injectable()
@Resolver()
@Roles(UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN, UserRoles.MODERATOR, UserRoles.USER)
export class UsersResolver {
  constructor (private readonly usersService: UsersService) {}

  @Query(() => UserListArgs)
  async users (@Args() query: UsersArgs): Promise<UserListArgs> {
    return this.usersService.findAll(query);
  }

  @Query(() => UserArgs)
  async user (@Arg('id') id: string): Promise<UserArgs> {
    return this.usersService.findOne(id);
  }

  @Mutation(() => UserArgs)
  async createUser (@Args() input: CreateUserArgs): Promise<JobResponseDto> {
    return this.usersService.create({ ...input, isActive: true });
  }

  @Mutation(() => UserArgs)
  async updateUser (@Args() { id, ...data }: UpdateUserArgs, @CurrentUser() currentUser: JwtPayload): Promise<JobResponseDto> {
    return this.usersService.update(id, data, currentUser);
  }

  @Mutation(() => DeleteResponseArgs)
  async deleteUser (@Arg('id') id: string, @CurrentUser() currentUser: JwtPayload): Promise<JobResponseDto> {
    return this.usersService.remove(id, currentUser);
  }
}
