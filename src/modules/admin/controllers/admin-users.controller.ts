import { Request } from 'express';

import { ApiController, BaseController } from '@common/controllers/base.controller';
import { UseGuards } from '@common/decorators/middleware.decorators';
import { Param, Body, Req } from '@common/decorators/param.decorators';
import { Patch, Post, Delete } from '@common/decorators/route.decorators';
import { AdminGuard } from '@common/guards/admin.guard';
import { UsersService } from '@modules/users/users.service';
import { StorageService } from '@core/storage/storage.service';
import { BadRequestException } from '@common/exceptions/http-exceptions';

@ApiController({ path: '/admin/users' })
@UseGuards(AdminGuard)
export class AdminUsersController extends BaseController {
  constructor (
    private readonly usersService: UsersService,
    private readonly storageService: StorageService
  ) {
    super({ path: '/admin/users' });
  }

  @Patch('/:id/verify')
  async toggleEmailVerification (@Param('id') id: string, @Body('isEmailVerified') isEmailVerified: boolean) {
    const updated = await this.usersService.update(id, { isEmailVerified });
    return { success: true, user: updated };
  }

  @Post('/:id/profile-image')
  async uploadProfileImage (@Param('id') id: string, @Req() req: Request) {
    const file = (req as { file?: { buffer: Buffer; originalname: string } }).file;
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const fileName = `profiles/${id}/${Date.now()}-${file.originalname}`;
    await this.storageService.upload(fileName, file.buffer);

    const profileImageUrl = fileName;
    const updated = await this.usersService.update(id, { profileImageUrl });

    return { success: true, user: updated };
  }

  @Delete('/:id/profile-image')
  async deleteProfileImage (@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (user?.profileImageUrl) {
      await this.storageService.delete(user.profileImageUrl);
    }

    const updated = await this.usersService.update(id, { profileImageUrl: null });
    return { success: true, user: updated };
  }
}
