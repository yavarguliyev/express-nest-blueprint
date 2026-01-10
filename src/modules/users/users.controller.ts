import { ApiController, BaseController } from '@common/controllers';
import { Injectable, Body, Param, Query, Get, Post, Put, Delete, Roles } from '@common/decorators';
import { PaginatedResponseDto } from '@common/dtos';
import { CreateUserDto, FindUsersQueryDto, UpdateUserDto, UserResponseDto } from '@modules/users/dtos';
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
