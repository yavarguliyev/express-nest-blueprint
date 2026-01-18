import { ApiController, AuthenticatedRequest, Body, Delete, Get, Patch, Post, Req, Roles } from '@config/libs';

import { UsersService } from '@modules/users/users.service';
import { UserResponseDto } from '@modules/users/dtos/user-response.dto';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';

@ApiController({ path: '/admin/profile' })
@Roles('admin')
export class AdminProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/')
  async getProfile(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    return this.usersService.findOne(String(req.user.sub));
  }

  @Patch('/')
  async updateProfile(@Req() req: AuthenticatedRequest, @Body() body: UpdateUserDto): Promise<UserResponseDto> {
    return this.usersService.update(String(req.user.sub), body);
  }

  @Post('/upload')
  async uploadAvatar(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    return this.usersService.updateProfileImage(String(req.user.sub), req?.file);
  }

  @Delete('/image')
  async deleteAvatar(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    return this.usersService.removeProfileImage(String(req.user.sub));
  }
}
