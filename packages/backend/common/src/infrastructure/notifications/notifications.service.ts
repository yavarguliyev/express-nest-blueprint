import { Injectable } from '../../core/decorators/injectable.decorator';
import { NotificationsRepository } from './notifications.repository';
import { CreateNotificationDto, NotificationEntity, NotificationQueryDto } from './notifications.interfaces';
import { NotFoundException } from '../../domain/exceptions/http-exceptions';

@Injectable()
export class NotificationsService {
  constructor (private readonly repository: NotificationsRepository) {}

  async createNotification (dto: CreateNotificationDto): Promise<NotificationEntity> {
    return this.repository.createNotification(dto);
  }

  async createBulkNotifications (dtos: CreateNotificationDto[]): Promise<NotificationEntity[]> {
    return Promise.all(dtos.map((dto) => this.repository.createNotification(dto)));
  }

  async getNotifications (query: NotificationQueryDto): Promise<{ notifications: NotificationEntity[]; total: number }> {
    return this.repository.findByRecipient(query);
  }

  async markAsRead (id: number, recipientId: number): Promise<NotificationEntity | null> {
    return this.repository.markAsRead(id, recipientId);
  }

  async markAllAsRead (recipientId: number): Promise<{ updated: number }> {
    const count = await this.repository.markAllAsRead(recipientId);
    return { updated: count };
  }

  async getUnreadCount (recipientId: number): Promise<{ count: number }> {
    const updated = await this.repository.getUnreadCount(recipientId);
    return { count: updated };
  }

  async deleteNotification (id: number, recipientId: number): Promise<{ success: boolean }> {
    const result = await this.repository.deleteNotification(id, recipientId);
    if (!result.success) throw new NotFoundException('Notification not found');
    return result;
  }

  async deleteAll (recipientId: number): Promise<{ success: boolean; deletedCount: number }> {
    return this.repository.deleteAll(recipientId);
  }
}
