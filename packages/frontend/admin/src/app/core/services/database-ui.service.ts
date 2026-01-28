import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { DatabaseDraftService } from './database-draft.service';

@Injectable({
  providedIn: 'root',
})
export class DatabaseUiService {
  private toastService = inject(ToastService);
  private draftService = inject(DatabaseDraftService);

  publishAllChanges (
    hasDrafts: boolean,
    isPublishing: (value: boolean) => void,
    loadTableData: () => void
  ): void {
    if (!hasDrafts) {
      this.toastService.info('No changes to publish');
      return;
    }
    isPublishing(true);
    this.draftService.publishDrafts().subscribe({
      next: (response) => {
        isPublishing(false);
        if (response.success) {
          this.toastService.success(
            `Successfully published ${response.summary.successful} changes`,
          );
          loadTableData();
        } else {
          this.toastService.error(
            `Published ${response.summary.successful} changes, ${response.summary.failed} failed`,
          );
        }
      },
      error: () => {
        isPublishing(false);
        this.toastService.error('Failed to publish changes');
      },
    });
  }

  resetAllChanges (
    hasDrafts: boolean,
    draftCount: number,
    loadTableData: () => void
  ): void {
    if (!hasDrafts) {
      this.toastService.info('No changes to reset');
      return;
    }
    this.toastService.confirm(
      `Reset all ${draftCount} unsaved changes? This cannot be undone.`,
      () => {
        this.draftService.resetDrafts();
        loadTableData();
        this.toastService.success('All changes have been reset');
      },
    );
  }

  handleImageClick (imageUrl: string): void {
    if (imageUrl?.trim()) {
      window.open(imageUrl, '_blank');
    } else {
      this.toastService.info('No image available.');
    }
  }

  setupScrollIndicators (container: HTMLDivElement): void {
    const updateScrollIndicators = (): void => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      container.classList.remove('scrolled-left', 'scrolled-right');
      if (scrollLeft > 0) container.classList.add('scrolled-left');
      if (scrollLeft < scrollWidth - clientWidth - 1) container.classList.add('scrolled-right');
    };
    setTimeout(updateScrollIndicators, 100);
    container.addEventListener('scroll', updateScrollIndicators);
    window.addEventListener('resize', updateScrollIndicators);
  }
}