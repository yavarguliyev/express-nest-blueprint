import { INotificationService } from '../../domain/interfaces/notification.interface';

export class NotificationHelperUtil {
  static changesPublished (service: INotificationService, count: number, itemType: string = 'changes'): void {
    service.success(`Successfully published ${count} ${itemType}`);
  }

  static changesReset (service: INotificationService): void {
    service.success('All changes have been reset');
  }

  static noChangesToPublish (service: INotificationService): void {
    service.info('No changes to publish');
  }

  static noChangesToReset (service: INotificationService): void {
    service.info('No changes to reset');
  }

  static noChangesToSave (service: INotificationService): void {
    service.info('No changes to save');
  }

  static operationError (service: INotificationService, operation: string, error?: unknown): void {
    const err = error as { error?: { message?: string }; message?: string } | undefined;
    const message = err?.error?.message || err?.message || `Failed to ${operation}`;
    service.error(message);
  }

  static validationError (service: INotificationService, message: string): void {
    service.error(message);
  }

  static confirmReset (service: INotificationService, callback: () => void, count?: number): void {
    const message = count ? `Reset all ${count} unsaved changes? This cannot be undone.` : 'Reset all unsaved changes? This cannot be undone.';
    service.confirm(message, callback);
  }

  static permissionDenied (service: INotificationService, action: string = 'perform this action'): void {
    service.error(`You do not have permission to ${action}`);
  }

  static sessionExpired (service: INotificationService): void {
    service.error('User session not found');
  }

  static invalidInput (service: INotificationService, fieldName: string): void {
    service.error(`Please provide a valid ${fieldName}`);
  }

  static requiredField (service: INotificationService, fieldName: string): void {
    service.error(`${fieldName} is required`);
  }

  static noChangesDetected (service: INotificationService): void {
    service.error('No changes detected to update.');
  }

  static publishPartialSuccess (service: INotificationService, successful: number, failed: number): void {
    service.error(`Published ${successful} changes, ${failed} failed`);
  }

  static refreshSuccess (service: INotificationService, itemType: string): void {
    service.success(`${itemType} refreshed successfully`);
  }

  static refreshError (service: INotificationService, itemType: string): void {
    service.error(`Failed to refresh ${itemType}`);
  }

  static notAvailable (service: INotificationService, itemType: string): void {
    service.info(`No ${itemType} available.`);
  }

  static onlyFileTypeAllowed (service: INotificationService, fileType: string): void {
    service.error(`Only ${fileType} files are allowed`);
  }
}
