import { Injectable, inject } from '@angular/core';

import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/ui/toast.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileAvatarService {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  deleteAvatar (): void {
    this.toastService.confirm('Are you sure you want to remove your profile photo?', (): void => {
      void (async (): Promise<void> => {
        try {
          await this.authService.deleteAvatar();
          this.toastService.success('Profile photo removed');
        } catch {
          this.toastService.error('Failed to remove profile photo');
        }
      })();
    });
  }

  async uploadAvatar (file: File): Promise<void> {
    if (!file.type.match('image.*')) {
      this.toastService.error('Only image files are allowed');
      throw new Error('Invalid file type');
    }

    try {
      await this.authService.uploadAvatar(file);
      this.toastService.success('Profile photo updated successfully');
    } catch {
      this.toastService.error('Failed to upload profile photo');
      throw new Error('Upload failed');
    }
  }
}
