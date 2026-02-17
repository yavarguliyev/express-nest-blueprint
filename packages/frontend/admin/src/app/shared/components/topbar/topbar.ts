import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { ToggleSwitch } from '../toggle-switch/toggle-switch.component';
import { DraggableResizableDirective } from '../../directives/draggable-resizable.directive';
import { SidebarService } from '../../../core/services/sidebar.service';
import { AdminThemeService } from '../../../core/services/admin-theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink, ToggleSwitch, DraggableResizableDirective],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private authService = inject(AuthService);
  private themeService = inject(AdminThemeService);
  private sidebarService = inject(SidebarService);
  private router = inject(Router);

  user = this.authService.currentUser;
  currentPageName = signal('Dashboard');
  isCollapsed = this.sidebarService.isCollapsed;

  constructor () {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event) => event.url),
      )
      .subscribe((url) => {
        this.currentPageName.set(this.getPageNameFromUrl(url));
      });

    this.currentPageName.set(this.getPageNameFromUrl(this.router.url));
  }

  isDarkMode (): boolean {
    return this.themeService.isDarkMode();
  }

  toggleTheme (): void {
    this.themeService.toggleTheme();
  }

  getUserInitials (): string {
    const currentUser = this.user();

    if (!currentUser) return 'U';

    const firstName = currentUser.firstName?.trim();
    const lastName = currentUser.lastName?.trim();

    if (!firstName || !lastName) return 'U';

    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    return initials;
  }

  private getPageNameFromUrl (url: string): string {
    const routeMap: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/database': 'Database',
      '/health': 'Health',
      '/settings': 'Settings',
      '/profile': 'Profile',
    };

    const basePath = url.split('?')[0];

    if (basePath && routeMap[basePath]) {
      return routeMap[basePath];
    }

    return 'Dashboard';
  }
}
