import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { DraggableResizableDirective } from '../../directives/draggable-resizable.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, DraggableResizableDirective],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private authService = inject(AuthService);
  private router = inject(Router);
  private sidebarService = inject(SidebarService);

  user = this.authService.currentUser;
  isCollapsed = this.sidebarService.isCollapsed;

  menuItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Database', icon: 'storage', route: '/database' },
    { label: 'System Health', icon: 'monitor_heart', route: '/health' },
    { label: 'Theme Editor', icon: 'palette', route: '/theme-editor' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ];

  getUserInitials (): string {
    const currentUser = this.user();

    if (!currentUser) return 'U';

    const firstName = currentUser.firstName?.trim();
    const lastName = currentUser.lastName?.trim();

    if (!firstName || !lastName) return 'U';

    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    return initials;
  }

  toggleSidebar (): void {
    this.sidebarService.toggle();
  }

  navigateToProfile (): void {
    void this.router.navigate(['/profile']);
  }

  logout (): void {
    this.authService.logout();
  }
}
