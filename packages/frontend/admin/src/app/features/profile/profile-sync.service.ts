import { Injectable, inject, OnDestroy } from '@angular/core';

import { AuthService } from '../../core/services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileSyncService implements OnDestroy {
  private authService = inject(AuthService);
  private visibilityListener: (() => void) | undefined;

  setupVisibilityListener (): void {
    this.visibilityListener = (): void => {
      if (!document.hidden) {
        const lastSync = localStorage.getItem('profile-last-sync');
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (!lastSync || now - parseInt(lastSync) > fiveMinutes) {
          void this.authService.syncProfile();
          localStorage.setItem('profile-last-sync', now.toString());
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityListener);
  }

  cleanupVisibilityListener (): void {
    if (this.visibilityListener) {
      document.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = undefined;
    }
  }

  ngOnDestroy (): void {
    this.cleanupVisibilityListener();
  }

  async initializeProfile (): Promise<void> {
    const hasValidProfile = this.authService.getCurrentUser();

    if (!hasValidProfile) {
      const cachedProfile = localStorage.getItem('admin_user');
      if (!cachedProfile) await this.authService.syncProfile();
    }
  }
}
