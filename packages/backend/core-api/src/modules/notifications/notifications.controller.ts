import { Request, Response } from 'express';

import { Get, Patch, Delete, Query, Param, Injectable, NotificationsService, NotificationStreamService, JwtPayload, CurrentUser, Req, Res, ApiController, BaseController, Roles, UserRoles } from '@config/libs';
import { NotificationQueryDto } from '@modules/notifications/dtos/notification-query.dto';

@Injectable()
@ApiController({ path: '/notifications' })
@Roles(UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN, UserRoles.MODERATOR, UserRoles.USER)
export class NotificationsController extends BaseController {
  constructor (
    private readonly notificationsService: NotificationsService,
    private readonly streamService: NotificationStreamService
  ) {
    super({ path: '/notifications' });
  }

  @Get()
  async getNotifications (@CurrentUser() user: JwtPayload, @Query() query: NotificationQueryDto) {
    return this.notificationsService.getNotifications({ ...query, recipientId: user.sub });
  }

  @Get('/unread-count')
  async getUnreadCount (@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Patch('/:id/read')
  async markAsRead (@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAsRead(parseInt(id, 10), user.sub);
  }

  @Patch('/read-all')
  async markAllAsRead (@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Delete('/all')
  async deleteAll (@CurrentUser() user: JwtPayload) {
    return this.notificationsService.deleteAll(user.sub);
  }

  @Delete('/:id')
  async deleteNotification (@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.deleteNotification(parseInt(id, 10), user.sub);
  }

  @Get('/stream')
  stream (@CurrentUser() user: JwtPayload, @Req() req: Request, @Res() res: Response) {
    return this.streamService.handleStream(user.sub, req, res);
  }
}
