import {
  BaseController,
  Roles,
  Injectable,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  CurrentUser,
  ApiController,
  PaginatedResponseDto,
  JwtPayload,
  UserRoles,
  JobResponseDto
} from '@config/libs';

import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { FindUsersQueryDto } from '@modules/users/dtos/find-users-query.dto';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';
import { UserResponseDto } from '@modules/users/dtos/user-response.dto';
import { UsersService } from '@modules/users/users.service';

@Injectable()
@ApiController({ path: '/users' })
@Roles(UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN, UserRoles.MODERATOR, UserRoles.USER)
export class UsersController extends BaseController {
  constructor (private readonly usersService: UsersService) {
    super({ path: '/users' });
  }

  @Get()
  async findAll (@Query() query: FindUsersQueryDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.usersService.findAll(query);
  }

  @Get('/:id')
  async findOne (@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Post()
  async create (@Body() createUserDto: CreateUserDto): Promise<JobResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Put('/:id')
  async update (@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() user: JwtPayload): Promise<JobResponseDto> {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete('/:id')
  async remove (@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<JobResponseDto> {
    return this.usersService.remove(id, user);
  }
}
