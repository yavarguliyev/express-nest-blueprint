import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth/auth.service';
import { ThemeService } from '../../../core/services/theme/theme.service';
import { SidebarService } from '../../../core/services/ui/sidebar.service';
import { UserUtilityService } from '../../../core/services/utilities/user-utility.service';
import { ToggleSwitch } from '../toggle-switch/toggle-switch';
import { DraggableResizableDirective } from '../../directives/draggable-resizable.directive';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink, ToggleSwitch, DraggableResizableDirective],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class Topbar {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private sidebarService = inject(SidebarService);
  private userUtility = inject(UserUtilityService);
  private router = inject(Router);

  // Mobile menu state
  mobileMenuOpen = input<boolean>(false);
  toggleMobileMenu = output<void>();

  user = this.authService.currentUser;
  currentPageName = signal('Dashboard');
  isCollapsed = this.sidebarService.isCollapsed;

  constructor () {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => event.url)
      )
      .subscribe(url => {
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
    return this.userUtility.getUserInitials(currentUser);
  }

  private getPageNameFromUrl (url: string): string {
    const routeMap: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/database': 'Database',
      '/health': 'Health',
      '/settings': 'Settings',
      '/profile': 'Profile'
    };

    const basePath = url.split('?')[0];
    if (basePath && routeMap[basePath]) return routeMap[basePath];
    return 'Dashboard';
  }
}
