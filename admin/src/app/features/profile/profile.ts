import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass p-8 max-w-2xl mx-auto">
      <div class="flex items-center gap-6 mb-8">
        <div class="relative group">
          <div class="avatar-lg glow overflow-hidden relative">
            <img *ngIf="user()?.profileImageUrl" [src]="user()?.profileImageUrl" alt="Avatar" />
            <span *ngIf="!user()?.profileImageUrl" class="material-icons" style="font-size: 48px">account_circle</span>
            
            <!-- Overlay for upload -->
            <label class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <span class="material-icons text-white">upload</span>
              <input type="file" class="hidden" (change)="onFileSelected($event)" accept="image/*">
            </label>
          </div>
          
          <!-- Delete button -->
          <button *ngIf="user()?.profileImageUrl" 
                  (click)="deleteAvatar()"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors z-10"
                  title="Remove photo">
            <span class="material-icons" style="font-size: 16px">close</span>
          </button>
        </div>

        <div>
          <h2 class="text-2xl font-bold">{{ user()?.firstName }} {{ user()?.lastName }}</h2>
          <p class="text-muted">{{ user()?.role }} • Account Administrator</p>
        </div>
      </div>

      <div class="grid gap-6">
        <div class="info-group">
          <label>Email Address</label>
          <div class="input-display">{{ user()?.email }}</div>
        </div>
        <div class="info-group">
          <label>User ID</label>
          <div class="input-display font-mono">#{{ user()?.id }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .p-8 { padding: 2rem; }
      .max-w-2xl { max-width: 48rem; }
      .mx-auto { margin-left: auto; margin-right: auto; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .gap-6 { gap: 1.5rem; }
      .mb-8 { margin-bottom: 2rem; }
      .relative { position: relative; }
      .absolute { position: absolute; }
      .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
      .hidden { display: none; }
      .overflow-hidden { overflow: hidden; }
      .opacity-0 { opacity: 0; }
      .group:hover .group-hover\\:opacity-100 { opacity: 1; }
      .transition-opacity { transition: opacity 0.2s; }
      .cursor-pointer { cursor: pointer; }
      .text-white { color: white; }
      .bg-red-500 { background-color: #ef4444; }
      .hover\\:bg-red-600:hover { background-color: #dc2626; }
      .rounded-full { border-radius: 9999px; }
      .p-1 { padding: 0.25rem; }
      .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
      .-top-2 { top: -0.5rem; }
      .-right-2 { right: -0.5rem; }
      .z-10 { z-index: 10; }
      
      .avatar-lg {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        isolation: isolate;
        border: 2px solid rgba(255, 255, 255, 0.1);
      }
      .avatar-lg img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .justify-center { justify-content: center; }
      .bg-black\\/50 { background-color: rgba(0, 0, 0, 0.5); }

      .grid { display: grid; }
      
      .info-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .info-group label {
        font-size: 0.85rem;
        color: #94a3b8;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-left: 4px;
      }
      
      .input-display {
        padding: 12px 16px;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #e2e8f0;
        font-size: 1rem;
        transition: all 0.2s ease;
      }
      
      .input-display:hover {
        background: rgba(15, 23, 42, 0.8);
        border-color: rgba(255, 255, 255, 0.2);
      }
      
      .font-mono { font-family: 'JetBrains Mono', monospace; }
    `,
  ],
})
export class Profile implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  user = this.authService.currentUser;

  ngOnInit () {
    void this.authService.syncProfile();
  }

  async onFileSelected (event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      if (!file.type.match('image.*')) {
        this.toastService.error('Only image files are allowed');
        input.value = ''; // Reset input
        return;
      }
      
      try {
        await this.authService.uploadAvatar(file);
        this.toastService.success('Profile photo updated successfully');
      } catch {
        this.toastService.error('Failed to upload profile photo');
      } finally {
        input.value = ''; // Reset input to allow re-uploading the same file
      }
    }
  }

  deleteAvatar () {
    this.toastService.confirm(
      'Are you sure you want to remove your profile photo?',
      () => {
        void (async () => {
          try {
            await this.authService.deleteAvatar();
            this.toastService.success('Profile photo removed');
          } catch {
            this.toastService.error('Failed to remove profile photo');
          }
        })();
      }
    );
  }
}
