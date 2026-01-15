import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Topbar],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <app-topbar></app-topbar>
        <main class="page-container">
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
      }
      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .page-container {
        padding: 0 20px 20px calc(var(--sidebar-width) + 40px);
        flex: 1;
      }
    `,
  ],
})
export class Layout {}
