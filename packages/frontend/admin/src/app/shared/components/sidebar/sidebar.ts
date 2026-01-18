import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private authService = inject(AuthService);
  
  user = this.authService.currentUser;

  menuItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Database', icon: 'storage', route: '/database' },
    { label: 'System Health', icon: 'monitor_heart', route: '/health' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ];

  getUserInitials(): string {
    const currentUser = this.user();
    if (!currentUser?.firstName || !currentUser?.lastName) {
      return 'U';
    }
    return (currentUser.firstName.charAt(0) + currentUser.lastName.charAt(0)).toUpperCase();
  }

  logout () {
    this.authService.logout();
  }
}
