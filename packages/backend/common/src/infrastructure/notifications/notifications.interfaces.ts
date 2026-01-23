export interface NotificationEntity {
  id: number;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  entityId: number | null;
  entityType: string | null;
  recipientId: number;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationDto {
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  entityId?: number;
  entityType?: string;
  recipientId: number;
}

export interface NotificationQueryDto {
  recipientId: number;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationEventPayload {
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  entityId?: number;
  entityType?: string;
  recipientIds: number[];
  timestamp: string;
}

export interface NotificationStreamClient {
  recipientId: number;
  response: Response;
}
