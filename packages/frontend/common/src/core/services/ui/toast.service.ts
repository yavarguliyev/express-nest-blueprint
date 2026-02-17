import { Injectable, signal, WritableSignal } from '@angular/core';

import { Toast } from '../../../domain/interfaces/toast.interface';
import { ToastType } from '../../../domain/types/toast.type';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts: WritableSignal<Toast[]> = signal<Toast[]>([]);
  private counter = 0;

  show (message: string, type: ToastType = 'info', duration: number = 4000, onConfirm?: () => void, onCancel?: () => void): void {
    const id = this.counter++;
    const toast: Toast = { id, message, type, duration, onConfirm, onCancel };
    this.toasts.update((t: Toast[]) => [...t, toast]);

    if (duration > 0) setTimeout(() => this.remove(id), duration);
  }

  success (message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error (message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  info (message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  warning (message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  confirm (message: string, onConfirm: () => void, onCancel?: () => void): void {
    this.show(message, 'confirm', 0, onConfirm, onCancel);
  }

  remove (id: number): void {
    this.toasts.update((t: Toast[]) => t.filter(toast => toast.id !== id));
  }
}
