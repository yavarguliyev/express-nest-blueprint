import { ToastService } from '../services/toast.service';

export class NotificationUtil {
  static recordCreated (service: ToastService, recordType: string = 'Record'): void {
    service.success(`${recordType} created successfully`);
  }

  static recordUpdated (service: ToastService, recordType: string = 'Record'): void {
    service.success(`${recordType} updated successfully`);
  }

  static recordDeleted (service: ToastService, recordType: string = 'Record'): void {
    service.success(`${recordType} deleted successfully`);
  }

  static changesPublished (
    service: ToastService,
    count: number,
    itemType: string = 'changes',
  ): void {
    service.success(`Successfully published ${count} ${itemType}`);
  }

  static changesReset (service: ToastService): void {
    service.success('All changes have been reset');
  }

  static noChangesToPublish (service: ToastService): void {
    service.info('No changes to publish');
  }

  static noChangesToReset (service: ToastService): void {
    service.info('No changes to reset');
  }

  static noChangesToSave (service: ToastService): void {
    service.info('No changes to save');
  }

  static loadSuccess (service: ToastService, itemType: string): void {
    service.success(`${itemType} loaded successfully`);
  }

  static loadError (service: ToastService, itemType: string): void {
    service.error(`Failed to load ${itemType}`);
  }

  static saveSuccess (service: ToastService, itemType: string = 'changes'): void {
    service.success(`Successfully saved ${itemType}`);
  }

  static saveError (service: ToastService, itemType: string = 'changes'): void {
    service.error(`Failed to save ${itemType}`);
  }

  static operationError (service: ToastService, operation: string, error?: unknown): void {
    const err = error as { error?: { message?: string }; message?: string } | undefined;
    const message = err?.error?.message || err?.message || `Failed to ${operation}`;
    service.error(message);
  }

  static validationError (service: ToastService, message: string): void {
    service.error(message);
  }

  static confirmDelete (
    service: ToastService,
    callback: () => void,
    itemName?: string,
    itemId?: number,
  ): void {
    const message = itemName
      ? `Delete ${itemName}? This cannot be undone.`
      : itemId
        ? `Mark record ${itemId} for deletion? You can review and apply all changes with "Save Changes".`
        : 'Delete this item? This cannot be undone.';

    service.confirm(message, callback);
  }

  static confirmReset (service: ToastService, callback: () => void, count?: number): void {
    const message = count
      ? `Reset all ${count} unsaved changes? This cannot be undone.`
      : 'Reset all unsaved changes? This cannot be undone.';
    service.confirm(message, callback);
  }

  static permissionDenied (service: ToastService, action: string = 'perform this action'): void {
    service.error(`You do not have permission to ${action}`);
  }

  static sessionExpired (service: ToastService): void {
    service.error('User session not found');
  }

  static invalidInput (service: ToastService, fieldName: string): void {
    service.error(`Please provide a valid ${fieldName}`);
  }

  static requiredField (service: ToastService, fieldName: string): void {
    service.error(`${fieldName} is required`);
  }

  static noChangesDetected (service: ToastService): void {
    service.error('No changes detected to update.');
  }

  static publishPartialSuccess (service: ToastService, successful: number, failed: number): void {
    service.error(`Published ${successful} changes, ${failed} failed`);
  }

  static refreshSuccess (service: ToastService, itemType: string): void {
    service.success(`${itemType} refreshed successfully`);
  }

  static refreshError (service: ToastService, itemType: string): void {
    service.error(`Failed to refresh ${itemType}`);
  }

  static notAvailable (service: ToastService, itemType: string): void {
    service.info(`No ${itemType} available.`);
  }

  static onlyFileTypeAllowed (service: ToastService, fileType: string): void {
    service.error(`Only ${fileType} files are allowed`);
  }
}
