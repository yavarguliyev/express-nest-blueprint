import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ToastService } from '../../../core/services/ui/toast.service';
import { Toast as ToastInterface } from '../../../core/interfaces/common.interface';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toastService.toasts()" class="toast glass" [ngClass]="toast.type">
        <div class="toast-content" (click)="toast.type !== 'confirm' && toastService.remove(toast.id)">
          <span class="material-icons toast-icon">
            {{ getIcon(toast.type) }}
          </span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="handleCancel(toast)">
            <span class="material-icons">close</span>
          </button>
        </div>

        <div *ngIf="toast.type === 'confirm'" class="toast-actions">
          <button class="action-btn cancel" (click)="handleCancel(toast)">ABORT</button>
          <button class="action-btn confirm" (click)="handleConfirm(toast)">PROCEED</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 20000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      }

      .toast {
        pointer-events: auto;
        min-width: 320px;
        max-width: 400px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        animation: toast-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border-left: 4px solid var(--primary);
        box-shadow: 0 8px 32px var(--toast-shadow);
        overflow: hidden;
        color: var(--toast-text-color);
      }

      .toast-content {
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
      }

      .toast.confirm {
        border-left-color: var(--toast-border-confirm);
        background: var(--toast-confirm-bg);
        cursor: default;
      }

      .toast-actions {
        display: flex;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .action-btn {
        flex: 1;
        padding: 12px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 1px;
        background: transparent;
        border: none;
        color: var(--toast-text-color);
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-btn:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .action-btn.confirm {
        color: var(--toast-text-color);
        border-left: 1px solid rgba(255, 255, 255, 0.3);
      }

      .action-btn.confirm:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      @keyframes toast-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .toast.success {
        border-left-color: var(--toast-border-success);
        background: var(--toast-success-bg);
      }
      .toast.error {
        border-left-color: var(--toast-border-error);
        background: var(--toast-error-bg);
      }
      .toast.info {
        border-left-color: var(--toast-border-info);
        background: var(--toast-info-bg);
      }
      .toast.warning {
        border-left-color: var(--toast-border-warning);
        background: var(--toast-warning-bg);
      }

      .toast-icon {
        font-size: 20px;
        color: var(--toast-icon-color);
      }
      .toast-message {
        flex: 1;
        font-size: 0.9rem;
        font-weight: 500;
      }
      .toast-close {
        background: transparent;
        border: none;
        color: inherit;
        opacity: 0.5;
        padding: 0;
        display: flex;
        align-items: center;
        cursor: pointer;
      }
      .toast-close span {
        font-size: 18px;
      }
    `
  ]
})
export class Toast {
  toastService = inject(ToastService);

  handleConfirm (toast: ToastInterface): void {
    if (toast.onConfirm) toast.onConfirm();
    this.toastService.remove(toast.id);
  }

  handleCancel (toast: ToastInterface): void {
    if (toast.onCancel) toast.onCancel();
    this.toastService.remove(toast.id);
  }

  getIcon (type: string): string {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
      case 'confirm':
        return 'warning';
      default:
        return 'info';
    }
  }
}
