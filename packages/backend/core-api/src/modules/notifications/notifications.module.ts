import { Module } from '@config/libs';

import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [NotificationsController],
  providers: []
})
export class NotificationsModule {}
