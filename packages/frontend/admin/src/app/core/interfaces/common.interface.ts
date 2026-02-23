import { ToastType } from '../enums/toast-type.enum';
import { Alignment } from '../types/toast.type';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface ShowToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface LayoutPosition {
  elementId: string;
  left: number;
  top: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface LayoutCustomization {
  userId: string;
  positions: LayoutPosition[];
  lastModified: Date;
}

export interface ColumnStyleConfig {
  headerClass: string;
  cellClass: string;
  alignment: Alignment;
  width?: string;
  minWidth?: string;
}

export interface SettingItem {
  id: string;
  label: string;
  description: string;
  value: boolean;
  isActive: boolean;
  category: string;
}

export interface SettingsUpdateRequest {
  settings: Array<{
    key: string;
    value: boolean;
    isActive?: boolean;
  }>;
}

export interface ErrorResponse {
  error?: { message?: string };
  message?: string;
}

export interface ModalConfig<T = unknown> {
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  data?: T;
}

export interface ModalRef<T = unknown, R = unknown> {
  close: (result?: R) => void;
  updateData: (data: T) => void;
}
