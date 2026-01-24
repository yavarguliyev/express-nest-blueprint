import { NotificationEntity, CreateNotificationDto, NotificationQueryDto } from './notifications.interfaces';
import { BaseRepository } from '../database/base.repository';
import { DatabaseService } from '../database/database.service';
import { Injectable } from '../../core/decorators/injectable.decorator';
import { CrudTable } from '../../core/decorators/crud.decorator';

@CrudTable({ category: 'Database Management', name: 'notifications', displayName: 'Notifications', actions: { create: false, update: false, delete: false } })
@Injectable()
export class NotificationsRepository extends BaseRepository<NotificationEntity> {
  constructor (databaseService: DatabaseService) {
    super(databaseService, 'notifications', {
      recipientId: 'recipient_id',
      entityId: 'entity_id',
      entityType: 'entity_type',
      isRead: 'is_read',
      readAt: 'read_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  protected getSelectColumns (): string[] {
    return ['id', 'type', 'title', 'message', 'metadata', 'entityId', 'entityType', 'recipientId', 'isRead', 'readAt', 'createdAt', 'updatedAt'];
  }

  async createNotification (dto: CreateNotificationDto): Promise<NotificationEntity> {
    const result = await this.create(dto as Partial<NotificationEntity>);
    return result as NotificationEntity;
  }

  async findByRecipient (query: NotificationQueryDto): Promise<{ notifications: NotificationEntity[]; total: number }> {
    const { recipientId, isRead, limit = 20, offset = 0 } = query;

    const where: Record<string, unknown> = { recipientId };
    if (isRead !== undefined) where['isRead'] = isRead;

    const result = await this.findWithPagination({ where, page: Math.floor(offset / limit) + 1, limit, orderBy: 'createdAt', orderDirection: 'DESC' });
    return { notifications: result.data, total: result.total };
  }

  async markAsRead (id: number, recipientId: number): Promise<NotificationEntity | null> {
    const existing = await this.findOne({ id, recipientId });
    if (!existing) return null;
    const result = await this.update(id, { isRead: true, readAt: new Date() } as Partial<NotificationEntity>);
    return result as NotificationEntity;
  }

  async markAllAsRead (recipientId: number): Promise<number> {
    const unreadNotifications = await this.findAll({ where: { recipientId, isRead: false } });
    await Promise.all(unreadNotifications.map((notification: NotificationEntity) => this.update(notification.id, { isRead: true, readAt: new Date() } as Partial<NotificationEntity>)));
    return unreadNotifications.length;
  }

  async getUnreadCount (recipientId: number): Promise<number> {
    return this.count({ where: { recipientId, isRead: false } });
  }

  async deleteNotification (id: number, recipientId: number): Promise<{ success: boolean }> {
    const existing = await this.findOne({ id, recipientId });
    if (!existing) return { success: false };
    const deleted = await this.delete(id);
    return { success: deleted };
  }

  async deleteAll (recipientId: number): Promise<{ success: boolean; deletedCount: number }> {
    const allNotifications = await this.findAll({ where: { recipientId } });
    await Promise.all(allNotifications.map((notification: NotificationEntity) => this.delete(notification.id)));
    return { success: true, deletedCount: allNotifications.length };
  }
}
