import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { filter, map } from 'rxjs/operators';
import { signal } from '@angular/core';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  user = this.authService.currentUser;
  currentPageName = signal('Dashboard');

  getUserInitials(): string {
    const currentUser = this.user();
    if (!currentUser?.firstName || !currentUser?.lastName) {
      return 'U';
    }
    return (currentUser.firstName.charAt(0) + currentUser.lastName.charAt(0)).toUpperCase();
  }

  constructor() {
    // Listen to route changes and update page name
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => (event as NavigationEnd).url)
      )
      .subscribe(url => {
        this.currentPageName.set(this.getPageNameFromUrl(url));
      });

    // Set initial page name
    this.currentPageName.set(this.getPageNameFromUrl(this.router.url));
  }

  private getPageNameFromUrl(url: string): string {
    const routeMap: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/database': 'Database',
      '/health': 'Health',
      '/settings': 'Settings',
      '/profile': 'Profile'
    };

    // Remove any query parameters and get the base path
    const basePath = url.split('?')[0];
    
    if (basePath && routeMap[basePath]) {
      return routeMap[basePath];
    }
    
    return 'Dashboard';
  }
}
