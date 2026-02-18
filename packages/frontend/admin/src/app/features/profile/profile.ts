import { Component, inject, OnInit, signal, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/ui/toast.service';
import { TextTransformService } from '../../core/services/utilities/text-transform.service';
import { UserRoleHelper } from '../../core/services/utilities/user-role-utility.service';
import { API_ENDPOINTS } from '../../core/constants/api.constants';
import { DraggableResizableDirective } from '../../shared/directives/draggable-resizable.directive';
import { ApiResponse, ErrorResponse } from '../../core/interfaces/common.interface';
import { ProfileForm } from '../../core/interfaces/auth.interface';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, DraggableResizableDirective],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private http = inject(HttpClient);
  private textTransform = inject(TextTransformService);

  user = this.authService.currentUser;
  loading = signal(false);

  profileForm: ProfileForm = {
    firstName: '',
    lastName: ''
  };

  private originalForm: ProfileForm = {
    firstName: '',
    lastName: ''
  };

  private visibilityListener?: () => void;

  constructor () {
    effect(() => {
      const currentUser = this.user();
      if (currentUser) this.updateFormFromUser(currentUser);
    });
  }

  ngOnInit (): void {
    const hasValidProfile = this.authService.getCurrentUser();

    if (!hasValidProfile) {
      const cachedProfile = localStorage.getItem('admin_user');
      if (!cachedProfile) {
        void this.authService.syncProfile();
      }
    }

    this.initializeForm();
    this.setupVisibilityListener();
  }

  ngOnDestroy (): void {
    if (this.visibilityListener) document.removeEventListener('visibilitychange', this.visibilityListener);
  }

  hasChanges (): boolean {
    return this.profileForm.firstName !== this.originalForm.firstName || this.profileForm.lastName !== this.originalForm.lastName;
  }

  resetForm (): void {
    this.profileForm = { ...this.originalForm };
  }

  getFieldDisplayName (fieldName: string): string {
    return this.textTransform.getDisplayName(fieldName);
  }

  getRoleDisplayName (): string {
    const currentUser = this.user();
    if (!currentUser || !currentUser.role) {
      return 'Unknown Role';
    }
    return UserRoleHelper.getRoleDisplayName(currentUser.role);
  }

  getUserInitials (): string {
    const currentUser = this.user();
    if (!currentUser) return 'U';

    const firstName = currentUser.firstName || '';
    const lastName = currentUser.lastName || '';

    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }

    const email = currentUser.email || '';
    if (email) {
      return email.charAt(0).toUpperCase();
    }

    return 'U';
  }

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

  async saveProfile (): Promise<void> {
    if (!this.hasChanges()) return;

    const currentUser = this.user();
    if (!currentUser) {
      this.toastService.error('User session not found');
      return;
    }

    this.loading.set(true);

    try {
      const updateData = {
        firstName: this.profileForm.firstName.trim(),
        lastName: this.profileForm.lastName.trim()
      };

      await this.http.patch<ApiResponse<void>>(API_ENDPOINTS.ADMIN.CRUD_ID('Database Management', 'users', currentUser.id), updateData).toPromise();

      this.originalForm = { ...this.profileForm };

      await this.authService.syncProfile();

      this.toastService.success('Profile information updated successfully');
    } catch (error) {
      const err = error as ErrorResponse;
      const message = err.error?.message || err.message || 'Failed to update profile';
      this.toastService.error(message);
    } finally {
      this.loading.set(false);
    }
  }

  async onFileSelected (event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      if (!file.type.match('image.*')) {
        this.toastService.error('Only image files are allowed');
        input.value = '';
        return;
      }

      try {
        await this.authService.uploadAvatar(file);
        this.toastService.success('Profile photo updated successfully');
      } catch {
        this.toastService.error('Failed to upload profile photo');
      } finally {
        input.value = '';
      }
    }
  }

  private setupVisibilityListener (): void {
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

  private updateFormFromUser (user: { firstName?: string; lastName?: string }): void {
    this.profileForm = {
      firstName: user.firstName || '',
      lastName: user.lastName || ''
    };

    this.originalForm = { ...this.profileForm };
  }

  private initializeForm (): void {
    const currentUser = this.user();
    if (currentUser) this.updateFormFromUser(currentUser);
  }
}
