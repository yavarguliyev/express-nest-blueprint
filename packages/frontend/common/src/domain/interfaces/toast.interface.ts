import { ToastType } from '../types/toast.type';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number | undefined;
  onConfirm?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
}
