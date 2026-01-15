import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass p-8 max-w-2xl mx-auto">
      <div class="flex items-center gap-6 mb-8">
        <div class="avatar-lg glow">
          <img *ngIf="user?.profileImageUrl" [src]="user?.profileImageUrl" alt="Avatar" />
          <span *ngIf="!user?.profileImageUrl" class="material-icons" style="font-size: 48px"
            >account_circle</span
          >
        </div>
        <div>
          <h2 class="text-2xl font-bold">{{ user?.firstName }} {{ user?.lastName }}</h2>
          <p class="text-muted">{{ user?.role }} • Account Administrator</p>
        </div>
      </div>

      <div class="grid gap-4">
        <div class="info-item">
          <label>Email Address</label>
          <span>{{ user?.email }}</span>
        </div>
        <div class="info-item">
          <label>User ID</label>
          <span>#{{ user?.id }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .p-8 {
        padding: 2rem;
      }
      .max-w-2xl {
        max-width: 42rem;
      }
      .mx-auto {
        margin-left: auto;
        margin-right: auto;
      }
      .flex {
        display: flex;
      }
      .items-center {
        align-items: center;
      }
      .gap-6 {
        gap: 1.5rem;
      }
      .mb-8 {
        margin-bottom: 2rem;
      }
      .avatar-lg {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .avatar-lg img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .info-item {
        display: flex;
        flex-direction: column;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
      }
      .info-item label {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-weight: 600;
        text-transform: uppercase;
      }
    `,
  ],
})
export class Profile {
  private authService = inject(AuthService);
  user = this.authService.getCurrentUser();
}
