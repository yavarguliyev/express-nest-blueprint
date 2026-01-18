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
    console.log('Sidebar - Current user data:', currentUser); // Debug log
    
    if (!currentUser) {
      return 'U';
    }
    
    const firstName = currentUser.firstName?.trim();
    const lastName = currentUser.lastName?.trim();
    
    if (!firstName || !lastName) {
      console.log('Sidebar - Missing name data:', { firstName, lastName }); // Debug log
      return 'U';
    }
    
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    console.log('Sidebar - Generated initials:', initials); // Debug log
    return initials;
  }

  logout () {
    this.authService.logout();
  }
}
