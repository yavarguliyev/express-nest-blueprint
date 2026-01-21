import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { SidebarService } from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Topbar],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content" [class.sidebar-collapsed]="isCollapsed()">
        <app-topbar></app-topbar>
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
        overflow-x: visible;
      }
      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow-x: visible;
        min-width: 0;
        transition: all 0.3s ease;
      }
      .page-container {
        padding: 0 20px 20px calc(var(--sidebar-width) + 40px);
        flex: 1;
        overflow-x: visible;
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
  
  isCollapsed = this.sidebarService.isCollapsed;
}
