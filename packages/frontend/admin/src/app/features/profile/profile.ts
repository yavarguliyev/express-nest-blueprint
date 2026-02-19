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
import { ProfileAvatarService } from './profile-avatar.service';
import { ProfileSyncService } from './profile-sync.service';

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
  private avatarService = inject(ProfileAvatarService);
  private syncService = inject(ProfileSyncService);
  private originalForm: ProfileForm = { firstName: '', lastName: '' };

  user = this.authService.currentUser;
  loading = signal(false);
  profileForm: ProfileForm = { firstName: '', lastName: '' };

  constructor () {
    effect(() => {
      const currentUser = this.user();
      if (currentUser) this.updateFormFromUser(currentUser);
    });
  }

  ngOnInit (): void {
    void this.syncService.initializeProfile();
    this.initializeForm();
    this.syncService.setupVisibilityListener();
  }

  ngOnDestroy (): void {
    this.syncService.cleanupVisibilityListener();
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
    if (!currentUser?.role) return 'Unknown Role';
    return UserRoleHelper.getRoleDisplayName(currentUser.role);
  }

  getUserInitials (): string {
    const currentUser = this.user();
    if (!currentUser) return 'U';

    const { firstName = '', lastName = '', email = '' } = currentUser;

    if (firstName && lastName && firstName[0] && lastName[0]) return (firstName[0] + lastName[0]).toUpperCase();
    if (firstName && firstName[0]) return firstName[0].toUpperCase();
    if (lastName && lastName[0]) return lastName[0].toUpperCase();
    if (email && email[0]) return email[0].toUpperCase();

    return 'U';
  }

  deleteAvatar (): void {
    this.avatarService.deleteAvatar();
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
      try {
        await this.avatarService.uploadAvatar(file);
      } catch {
        throw new Error('Invalid file type');
      } finally {
        input.value = '';
      }
    }
  }

  private updateFormFromUser (user: { firstName?: string; lastName?: string }): void {
    this.profileForm = { firstName: user.firstName || '', lastName: user.lastName || '' };
    this.originalForm = { ...this.profileForm };
  }

  private initializeForm (): void {
    const currentUser = this.user();
    if (currentUser) this.updateFormFromUser(currentUser);
  }
}
