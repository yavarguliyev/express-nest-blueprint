import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { SidebarService } from '../../../core/services/ui/sidebar.service';
import { DraftStatusBar } from '../draft-status-bar/draft-status-bar';
import { DraftStatusConfig } from '../../../core/interfaces/theme.interface';
import { LayoutCustomizationService } from '../../../core/services/ui/layout-customization.service';
import { ToastService } from '../../../core/services/ui/toast.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Topbar, DraftStatusBar],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  private sidebarService = inject(SidebarService);
  private layoutService = inject(LayoutCustomizationService);
  private toastService = inject(ToastService);

  isCollapsed = this.sidebarService.isCollapsed;
  isSaving = signal(false);
  mobileMenuOpen = signal(false);

  layoutDraftConfig = computed<DraftStatusConfig>(() => ({
    draftCount: this.layoutService.draftCount(),
    hasDrafts: this.layoutService.hasDrafts(),
    affectedItems: this.layoutService.changedElements(),
    isProcessing: this.isSaving(),
    itemType: 'item',
    resetButtonText: 'Reset Layout',
    saveButtonText: 'Save Layout',
    resetButtonIcon: 'settings_backup_restore',
    saveButtonIcon: 'cloud_upload'
  }));

  toggleMobileMenu (): void {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu (): void {
    this.mobileMenuOpen.set(false);
  }

  saveLayoutChanges (): void {
    this.isSaving.set(true);
    setTimeout(() => {
      this.layoutService.publishDrafts();
      this.isSaving.set(false);
      this.toastService.success('Layout changes saved successfully');
    }, 1000);
  }

  resetLayoutChanges (): void {
    this.toastService.confirm('Reset all layout changes?', () => {
      this.layoutService.resetDrafts();
      this.toastService.info('Layout changes reset');
    });
  }
}
