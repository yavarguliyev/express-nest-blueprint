import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { SidebarService } from '../../../core/services/sidebar.service';
import { DraftStatusBar } from '../draft-status-bar/draft-status-bar';
import { LayoutCustomizationService } from '../../../core/services/layout-customization.service';
import { computed, signal } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { DraftStatusConfig } from '../../../core/interfaces/token.interface';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Topbar, DraftStatusBar],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content" [class.sidebar-collapsed]="isCollapsed()">
        <app-topbar></app-topbar>

        <app-draft-status-bar
          [config]="layoutDraftConfig()"
          (saveChanges)="saveLayoutChanges()"
          (resetChanges)="resetLayoutChanges()"
        >
        </app-draft-status-bar>

        <main class="page-container" [class.sidebar-collapsed]="isCollapsed()">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .app-layout {
        display: flex;
        min-height: 100vh;
        background-color: var(--bg-deep);
        overflow: visible !important;
      }
      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: visible !important;
        min-width: 0;
        transition: all 0.3s ease;
      }
      .page-container {
        padding: 0 20px 20px calc(var(--sidebar-width) + 40px);
        flex: 1;
        overflow: visible !important;
        min-width: 0;
        width: 100%;
        transition: padding-left 0.3s ease;
      }
      .page-container.sidebar-collapsed {
        padding-left: calc(80px + 40px);
      }
    `,
  ],
})
export class Layout {
  private sidebarService = inject(SidebarService);
  private layoutService = inject(LayoutCustomizationService);
  private toastService = inject(ToastService);

  isCollapsed = this.sidebarService.isCollapsed;
  isSaving = signal(false);

  layoutDraftConfig = computed<DraftStatusConfig>(() => ({
    draftCount: this.layoutService.draftCount(),
    hasDrafts: this.layoutService.hasDrafts(),
    affectedItems: this.layoutService.changedElements(),
    isProcessing: this.isSaving(),
    itemType: 'item',
    resetButtonText: 'Reset Layout',
    saveButtonText: 'Save Layout',
    resetButtonIcon: 'settings_backup_restore',
    saveButtonIcon: 'cloud_upload',
  }));

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
