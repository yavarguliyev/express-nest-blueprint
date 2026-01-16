import { ApiController, BaseController } from '@common/controllers/base.controller';
import { Roles } from '@common/decorators/auth.decorator';
import { Injectable} from '@common/decorators/injectable.decorator';
import { Get, Post, Put, Delete } from '@common/decorators/route.decorators';
import { Body, Param, Query } from '@common/decorators/param.decorators';
import { PaginatedResponseDto } from '@common/dtos/paginated-response.dto';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { FindUsersQueryDto } from '@modules/users/dtos/find-users-query.dto';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';
import { UserResponseDto } from '@modules/users/dtos/user-response.dto';
import { UsersService } from '@modules/users/users.service';

@Injectable()
@ApiController({ path: '/users' })
@Roles('admin', 'moderator')
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
  async create (@Body() createUserDto: CreateUserDto): Promise<UserResponseDto | null> {
    return this.usersService.create(createUserDto);
  }

  @Put('/:id')
  async update (@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('/:id')
  async remove (@Param('id') id: string): Promise<{ message: string }> {
    return this.usersService.remove(id);
  }
}
