import { NotificationEventPayload, CreateNotificationDto } from './notifications.interfaces';
import { NotificationsService } from './notifications.service';
import { KafkaService } from '../kafka/kafka.service';
import { KafkaMessagePayload } from '../kafka/kafka.interfaces';
import { Injectable } from '../../core/decorators/injectable.decorator';
import { Logger } from '../logger/logger.service';
import { getErrorMessage } from '../../domain/helpers/utility-functions.helper';
import { ConfigService } from '../config/config.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class NotificationEventHandler {
  private readonly logger: Logger;
  private readonly appRole: string;

  constructor (
    private readonly kafkaService: KafkaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService
  ) {
    this.appRole = this.configService.get('APP_ROLE', 'API');
    this.logger = new Logger(`${NotificationEventHandler.name}:${this.appRole}:${process.pid}`);
  }

  async startConsuming (): Promise<void> {
    if (this.appRole !== 'WORKER') {
      this.logger.log('Skipping notification consumer initialization (Role is not WORKER)');
      return;
    }

    this.logger.log('Starting notification event consumer...');

    try {
      await this.kafkaService.subscribe({ topic: 'notification.events' }, async (payload: KafkaMessagePayload<NotificationEventPayload>) => {
        const event = payload.value;
        this.logger.log(`Received notification event: ${event?.type}`);

        if (!event || !event.recipientIds) {
          this.logger.warn('Received invalid notification event (missing event or recipientIds)');
          return;
        }

        try {
          const notifications = await this.notificationsService.createBulkNotifications(
            event?.recipientIds?.map((recipientId) => {
              const dto: CreateNotificationDto = {
                type: event.type,
                title: event.title,
                message: event.message,
                recipientId
              };

              if (event.metadata) dto.metadata = event.metadata;
              if (event.entityId) dto.entityId = event.entityId;
              if (event.entityType) dto.entityType = event.entityType;

              return dto;
            })
          );

          this.logger.log(`Created ${notifications.length} notifications`);

          for (const notification of notifications) {
            await this.redisService.getClient().publish('notifications', JSON.stringify(notification));
          }
        } catch (error) {
          this.logger.error(`Error processing notification event: ${getErrorMessage(error)}`);
        }
      });
      this.logger.log('Notification consumer initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to start notification consumer: ${getErrorMessage(error)}`);
    }

    this.logger.log('Notification consumer background task initiated');
  }
}
