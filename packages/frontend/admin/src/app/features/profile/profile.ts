import { Component, inject, OnInit, signal, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TextTransformService } from '../../core/services/text-transform.service';
import { UserRoleHelper } from '../../core/enums/user-roles.enum';

interface ProfileForm {
  firstName: string;
  lastName: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ErrorResponse {
  error?: {
    message?: string;
  };
  message?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
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
    lastName: '',
  };

  private originalForm: ProfileForm = {
    firstName: '',
    lastName: '',
  };

  private visibilityListener?: () => void;

  constructor () {
    effect(() => {
      const currentUser = this.user();
      if (currentUser) {
        this.updateFormFromUser(currentUser);
      }
    });
  }

  ngOnInit () {
    void this.authService.syncProfile();
    this.initializeForm();
    this.setupVisibilityListener();
  }

  ngOnDestroy () {
    if (this.visibilityListener) {
      document.removeEventListener('visibilitychange', this.visibilityListener);
    }
  }

  private setupVisibilityListener () {
    this.visibilityListener = () => {
      if (!document.hidden) {
        void this.authService.syncProfile();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityListener);
  }

  private updateFormFromUser (user: { firstName?: string; lastName?: string }) {
    this.profileForm = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    };
    this.originalForm = { ...this.profileForm };
  }

  private initializeForm () {
    const currentUser = this.user();
    if (currentUser) {
      this.updateFormFromUser(currentUser);
    }
  }

  hasChanges (): boolean {
    return (
      this.profileForm.firstName !== this.originalForm.firstName ||
      this.profileForm.lastName !== this.originalForm.lastName
    );
  }

  resetForm () {
    this.profileForm = { ...this.originalForm };
  }

  async saveProfile () {
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
        lastName: this.profileForm.lastName.trim(),
      };

      await this.http
        .patch<
          ApiResponse<void>
        >(`/api/v1/admin/crud/Database Management/users/${currentUser.id}`, updateData)
        .toPromise();

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

  async onFileSelected (event: Event) {
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

  deleteAvatar () {
    this.toastService.confirm('Are you sure you want to remove your profile photo?', () => {
      void (async () => {
        try {
          await this.authService.deleteAvatar();
          this.toastService.success('Profile photo removed');
        } catch {
          this.toastService.error('Failed to remove profile photo');
        }
      })();
    });
  }
}
