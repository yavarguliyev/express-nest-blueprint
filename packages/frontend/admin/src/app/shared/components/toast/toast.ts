import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ToastService } from '../../../core/services/ui/toast.service';
import { Toast as ToastInterface } from '../../../core/interfaces/common.interface';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class Toast {
  toastService = inject(ToastService);

  private readonly ICON_MAP: Record<string, string> = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    confirm: 'warning',
    info: 'info'
  };

  handleConfirm (toast: ToastInterface): void {
    if (toast.onConfirm) toast.onConfirm();
    this.toastService.remove(toast.id);
  }

  handleCancel (toast: ToastInterface): void {
    if (toast.onCancel) toast.onCancel();
    this.toastService.remove(toast.id);
  }

  getIcon (type: string): string | undefined {
    return this.ICON_MAP[type] || this.ICON_MAP['info'];
  }
}
