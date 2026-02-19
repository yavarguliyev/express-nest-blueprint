import { Injectable, signal, TemplateRef, Type } from '@angular/core';

import { ModalConfig, ModalRef } from '../../interfaces/common.interface';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private isOpen = signal(false);
  private modalConfig = signal<ModalConfig | null>(null);
  private modalContent = signal<TemplateRef<unknown> | Type<unknown> | null>(null);
  private modalData = signal<unknown>(null);
  private closeCallback: ((result?: unknown) => void) | null = null;

  readonly isModalOpen = this.isOpen.asReadonly();
  readonly config = this.modalConfig.asReadonly();
  readonly content = this.modalContent.asReadonly();
  readonly data = this.modalData.asReadonly();

  open<T = unknown, R = unknown> (content: TemplateRef<T> | Type<T>, config: ModalConfig<T> = {}): ModalRef<T, R> {
    const defaultConfig: ModalConfig<T> = {
      size: 'medium',
      closeOnBackdropClick: true,
      closeOnEscape: true,
      showCloseButton: true,
      ...config
    };

    this.modalContent.set(content);
    this.modalConfig.set(defaultConfig);
    this.modalData.set(config.data || null);
    this.isOpen.set(true);

    document.body.classList.add('modal-open');

    if (defaultConfig.closeOnEscape) this.setupEscapeListener();

    return {
      close: (result?: R) => this.close(result),
      updateData: (data: T) => this.modalData.set(data)
    };
  }

  close<R = unknown> (result?: R): void {
    this.isOpen.set(false);
    this.modalContent.set(null);
    this.modalConfig.set(null);
    this.modalData.set(null);

    document.body.classList.remove('modal-open');
    this.removeEscapeListener();

    if (this.closeCallback) {
      this.closeCallback(result as unknown);
      this.closeCallback = null;
    }
  }

  onClose<R = unknown> (callback: (result?: R) => void): void {
    this.closeCallback = callback as (result?: unknown) => void;
  }

  handleBackdropClick (): void {
    if (this.modalConfig()?.closeOnBackdropClick) this.close();
  }

  private escapeListener = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.close();
  };

  private setupEscapeListener (): void {
    document.addEventListener('keydown', this.escapeListener);
  }

  private removeEscapeListener (): void {
    document.removeEventListener('keydown', this.escapeListener);
  }
}
