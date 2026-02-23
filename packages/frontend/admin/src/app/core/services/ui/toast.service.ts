import { Injectable, signal } from '@angular/core';

import { ShowToastOptions, Toast } from '../../interfaces/common.interface';
import { ToastType } from '../../enums/toast-type.enum';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private counter = 0;

  toasts = signal<Toast[]>([]);

  show (options: ShowToastOptions): void {
    const { message, type = ToastType.INFO, duration = 4000, onConfirm, onCancel } = options;
    const id = this.counter++;
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      ...(onConfirm !== undefined && { onConfirm }),
      ...(onCancel !== undefined && { onCancel })
    };

    this.toasts.update(t => [...t, toast]);

    if (duration > 0) setTimeout(() => this.remove(id), duration);
  }

  success (message: string, duration?: number): void {
    this.show({ message, type: ToastType.SUCCESS, ...(duration !== undefined ? { duration } : {}) });
  }

  error (message: string, duration?: number): void {
    this.show({ message, type: ToastType.ERROR, ...(duration !== undefined ? { duration } : {}) });
  }

  info (message: string, duration?: number): void {
    this.show({ message, type: ToastType.INFO, ...(duration !== undefined ? { duration } : {}) });
  }

  warning (message: string, duration?: number): void {
    this.show({ message, type: ToastType.WARNING, ...(duration !== undefined ? { duration } : {}) });
  }

  confirm (message: string, onConfirm: () => void, onCancel?: () => void): void {
    this.show({ message, type: ToastType.CONFIRM, duration: 0, onConfirm, ...(onCancel ? { onCancel } : {}) });
  }

  remove (id: number): void {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
