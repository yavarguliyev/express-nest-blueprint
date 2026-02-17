import { INotificationService, NotificationOptions } from '../../domain/interfaces/notification.interface';

export class NotificationUtil {
  static success (service: INotificationService, message: string, options?: NotificationOptions): void {
    service.success(message, options);
  }

  static error (service: INotificationService, message: string, options?: NotificationOptions): void {
    service.error(message, options);
  }

  static warning (service: INotificationService, message: string, options?: NotificationOptions): void {
    service.warning(message, options);
  }

  static info (service: INotificationService, message: string, options?: NotificationOptions): void {
    service.info(message, options);
  }

  static confirm (service: INotificationService, message: string, onConfirm: () => void, onCancel?: () => void): void {
    service.confirm(message, onConfirm, onCancel);
  }

  static loadSuccess (service: INotificationService, resourceName: string): void {
    service.success(`${resourceName} loaded successfully`);
  }

  static loadError (service: INotificationService, resourceName: string): void {
    service.error(`Failed to load ${resourceName}`);
  }

  static saveSuccess (service: INotificationService, resourceName: string): void {
    service.success(`${resourceName} saved successfully`);
  }

  static saveError (service: INotificationService, resourceName: string): void {
    service.error(`Failed to save ${resourceName}`);
  }

  static deleteSuccess (service: INotificationService, resourceName: string): void {
    service.success(`${resourceName} deleted successfully`);
  }

  static deleteError (service: INotificationService, resourceName: string): void {
    service.error(`Failed to delete ${resourceName}`);
  }

  static confirmDelete (service: INotificationService, onConfirm: () => void, resourceName?: string, id?: number): void {
    const message = resourceName && id ? `Are you sure you want to delete ${resourceName} #${id}?` : 'Are you sure you want to delete this item?';
    service.confirm(message, onConfirm);
  }

  static createSuccess (service: INotificationService, resourceName: string): void {
    service.success(`${resourceName} created successfully`);
  }

  static createError (service: INotificationService, resourceName: string): void {
    service.error(`Failed to create ${resourceName}`);
  }

  static updateSuccess (service: INotificationService, resourceName: string): void {
    service.success(`${resourceName} updated successfully`);
  }

  static updateError (service: INotificationService, resourceName: string): void {
    service.error(`Failed to update ${resourceName}`);
  }
}
