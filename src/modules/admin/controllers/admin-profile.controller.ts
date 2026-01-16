import { ApiController } from '@common/controllers/base.controller';
import { RequireAuth } from '@common/decorators/auth.decorator';
import { UseGuards } from '@common/decorators/middleware.decorators';
import { Get, Patch, Post, Delete } from '@common/decorators/route.decorators';
import { Req, Body } from '@common/decorators/param.decorators';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { UsersService } from '@modules/users/users.service';
import { UserResponseDto } from '@modules/users/dtos/user-response.dto';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';
import { AuthenticatedRequest } from '@common/interfaces/common.interface';

@ApiController({ path: '/admin/profile' })
@RequireAuth()
@UseGuards(AuthGuard, RolesGuard)
export class AdminProfileController {
  constructor (private readonly usersService: UsersService) {}

  @Get('/')
  async getProfile (@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    return this.usersService.findOne(String(req.user.sub));
  }

  @Patch('/')
  async updateProfile (@Req() req: AuthenticatedRequest, @Body() body: UpdateUserDto): Promise<UserResponseDto> {
    return this.usersService.update(String(req.user.sub), body);
  }

  @Post('/upload')
  async uploadAvatar (@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    return this.usersService.updateProfileImage(String(req.user.sub), req?.file);
  }

  @Delete('/image')
  async deleteAvatar (@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    return this.usersService.removeProfileImage(String(req.user.sub));
  }
}
