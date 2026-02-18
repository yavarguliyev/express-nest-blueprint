import { Injectable, signal } from '@angular/core';

import { Toast } from '../../interfaces/common.interface';
import { ToastType } from '../../enums/toast-type.enum';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private counter = 0;

  toasts = signal<Toast[]>([]);

  show (message: string, type: ToastType = ToastType.INFO, duration: number = 4000, onConfirm?: () => void, onCancel?: () => void): void {
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
    this.show(message, ToastType.SUCCESS, duration);
  }

  error (message: string, duration?: number): void {
    this.show(message, ToastType.ERROR, duration);
  }

  info (message: string, duration?: number): void {
    this.show(message, ToastType.INFO, duration);
  }

  warning (message: string, duration?: number): void {
    this.show(message, ToastType.WARNING, duration);
  }

  confirm (message: string, onConfirm: () => void, onCancel?: () => void): void {
    this.show(message, ToastType.CONFIRM, 0, onConfirm, onCancel);
  }

  remove (id: number): void {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
