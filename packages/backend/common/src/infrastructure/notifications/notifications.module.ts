import { NotificationEventHandler } from './notification-event.handler';
import { NotificationStreamService } from './notification-stream.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { Module } from '../../core/decorators/module.decorator';
import { DynamicModule } from '../../domain/interfaces/common.interface';

@Module({
  providers: [],
  exports: []
})
export class NotificationsModule {
  static forRoot (): DynamicModule {
    return {
      module: NotificationsModule,
      global: true,
      providers: [
        NotificationsService,
        NotificationsRepository,
        NotificationStreamService,
        NotificationEventHandler,
        {
          provide: 'NOTIFICATION_INITIALIZER',
          useFactory: ((handler: NotificationEventHandler) => () => handler.startConsuming()) as (...args: unknown[]) => unknown,
          inject: [NotificationEventHandler]
        }
      ],
      exports: [NotificationsService, NotificationStreamService, NotificationEventHandler, 'NOTIFICATION_INITIALIZER']
    };
  }
}
