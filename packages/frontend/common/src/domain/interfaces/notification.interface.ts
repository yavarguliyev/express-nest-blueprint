export enum NotificationType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

export enum NotificationPosition {
  TOP_LEFT = 'TOP_LEFT',
  TOP_CENTER = 'TOP_CENTER',
  TOP_RIGHT = 'TOP_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  BOTTOM_CENTER = 'BOTTOM_CENTER',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT'
}

export interface NotificationAction {
  label: string;
  callback: () => void;
}

export interface NotificationOptions {
  duration?: number;
  position?: NotificationPosition;
  action?: NotificationAction;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  options?: NotificationOptions;
  timestamp: Date;
}

export interface INotificationService {
  show(type: NotificationType, message: string, options?: NotificationOptions): void;
  success(message: string, options?: NotificationOptions): void;
  error(message: string, options?: NotificationOptions): void;
  warning(message: string, options?: NotificationOptions): void;
  info(message: string, options?: NotificationOptions): void;
  confirm(message: string, onConfirm: () => void, onCancel?: () => void): void;
}
