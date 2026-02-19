import { Component, inject, ViewContainerRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../core/services/ui/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('contentContainer', { read: ViewContainerRef }) contentContainer!: ViewContainerRef;

  modalService = inject(ModalService);

  ngAfterViewInit (): void {}
  ngOnDestroy (): void {}

  closeModal (): void {
    this.modalService.close();
  }

  handleBackdropClick (): void {
    this.modalService.handleBackdropClick();
  }

  stopPropagation (event: Event): void {
    event.stopPropagation();
  }

  getSizeClass (): string {
    return `modal-${this.modalService.config()?.size || 'medium'}`;
  }
}
