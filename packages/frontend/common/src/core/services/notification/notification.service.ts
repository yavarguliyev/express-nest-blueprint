import { Injectable, Signal, computed, signal } from '@angular/core';

import {
  INotificationService,
  Notification,
  NotificationOptions,
  NotificationType,
  NotificationPosition
} from '../../../domain/interfaces/notification.interface';

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements INotificationService {
  private _notifications = signal<Notification[]>([]);
  private notificationIdCounter = 0;

  readonly notifications: Signal<Notification[]> = this._notifications.asReadonly();
  readonly notificationCount: Signal<number> = computed(() => this._notifications().length);
  readonly hasNotifications: Signal<boolean> = computed(() => this._notifications().length > 0);

  show (type: NotificationType, message: string, options?: NotificationOptions): void {
    const notification: Notification = {
      id: this.generateId(),
      type,
      message,
      options: {
        duration: options?.duration || 5000,
        position: options?.position || NotificationPosition.TOP_RIGHT,
        action: options?.action
      },
      timestamp: new Date()
    };

    this._notifications.update(notifications => [...notifications, notification]);

    if (notification.options?.duration && notification.options.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.options.duration);
    }
  }

  success (message: string, options?: NotificationOptions): void {
    this.show(NotificationType.SUCCESS, message, options);
  }

  error (message: string, options?: NotificationOptions): void {
    this.show(NotificationType.ERROR, message, {
      ...options,
      duration: options?.duration || 7000
    });
  }

  warning (message: string, options?: NotificationOptions): void {
    this.show(NotificationType.WARNING, message, options);
  }

  info (message: string, options?: NotificationOptions): void {
    this.show(NotificationType.INFO, message, options);
  }

  confirm (message: string, onConfirm: () => void): void {
    this.show(NotificationType.WARNING, message, {
      duration: 0,
      action: {
        label: 'Confirm',
        callback: () => {
          onConfirm();
        }
      }
    });
  }

  dismiss (id: string): void {
    this._notifications.update(notifications => notifications.filter(n => n.id !== id));
  }

  dismissAll (): void {
    this._notifications.set([]);
  }

  getByType (type: NotificationType): Signal<Notification[]> {
    return computed(() => this._notifications().filter(n => n.type === type));
  }

  private generateId (): string {
    return `notification_${++this.notificationIdCounter}_${Date.now()}`;
  }
}
