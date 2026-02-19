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
  template: `
    <div class="app-layout">
      <!-- Mobile Overlay -->
      <div class="mobile-sidebar-overlay" [class.active]="mobileMenuOpen()" (click)="closeMobileMenu()"></div>

      <!-- Sidebar with mobile state -->
      <app-sidebar [mobileOpen]="mobileMenuOpen()"></app-sidebar>

      <div class="main-content" [class.sidebar-collapsed]="isCollapsed()">
        <app-topbar 
          [mobileMenuOpen]="mobileMenuOpen()"
          (toggleMobileMenu)="toggleMobileMenu()">
        </app-topbar>

        <app-draft-status-bar [config]="layoutDraftConfig()" (saveChanges)="saveLayoutChanges()" (resetChanges)="resetLayoutChanges()">
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
        position: relative;
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

      /* Mobile sidebar overlay */
      .mobile-sidebar-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10001;
        display: none;
      }

      .mobile-sidebar-overlay.active {
        display: block;
      }

      /* Responsive breakpoints */
      @media (max-width: 768px) {
        .page-container {
          padding: 80px 16px 40px 16px !important;
        }

        .page-container.sidebar-collapsed {
          padding: 80px 16px 40px 16px !important;
        }
      }

      @media (min-width: 769px) and (max-width: 1024px) {
        .page-container {
          padding: 0 24px 24px calc(220px + 40px);
        }
        
        .page-container.sidebar-collapsed {
          padding-left: calc(70px + 40px);
        }
      }
    `
  ]
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

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
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
