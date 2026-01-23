import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-dropdown">
      <button class="notification-bell" (click)="toggleDropdown()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        @if (unreadCount() > 0) {
          <span class="badge" style="color: var(--text-main, #e2e8f0) !important; -webkit-text-fill-color: var(--text-main, #e2e8f0) !important; background-clip: border-box !important;">{{ unreadCount() }}</span>
        }
      </button>

      @if (isOpen()) {
        <div class="dropdown-panel">
          <div class="dropdown-header">
            <h3>Notifications</h3>
            <div class="actions">
              @if (unreadCount() > 0) {
                <button class="text-btn" (click)="markAllAsRead()">Mark all read</button>
              }
              @if (notifications().length > 0) {
                <button type="button" class="text-btn danger" (click)="deleteAll()">Clear all</button>
              }
            </div>
          </div>

          <div class="notifications-list">
            @if (loading()) {
              <div class="loading" style="color: var(--primary);">Loading...</div>
            } @else if (notifications().length === 0) {
              <div class="empty-state">
                <p style="color: var(--text-muted);">No notifications yet</p>
              </div>
            } @else {
              @for (notification of notifications(); track notification.id) {
                <div class="notification-item" [class.unread]="!notification.isRead" style="display: flex !important;">
                  <div class="notification-content">
                    <p style="color: var(--text-main) !important; margin: 0; font-size: 12px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                      <span>{{ notification.message }}</span>
                      <span style="color: var(--text-muted); font-size: 11px; white-space: nowrap;">{{ formatTime(notification.createdAt) }}</span>
                    </p>
                  </div>
                  <div class="notification-actions">
                    @if (!notification.isRead) {
                      <button
                        class="icon-btn"
                        (click)="markAsRead(notification.id)"
                        title="Mark as read"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </button>
                    }
                    <button
                      class="icon-btn danger"
                      (click)="deleteNotification(notification.id)"
                      title="Delete"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        position: relative;
        z-index: 10005;
      }

      .notification-dropdown {
        position: relative;
        display: block;
      }

      .notification-bell {
        position: relative;
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        color: var(--text-main, #333);
        transition: color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .notification-bell:hover {
        color: var(--primary, #007bff);
      }

      .badge {
        position: absolute;
        top: -6px;
        right: -6px;
        background: var(--danger, #dc3545);
        background: var(--danger, #dc3545) !important;
        color: #ffffff !important;
        line-height: 1;
        border-radius: 50%;
        padding: 4px;
        font-size: 10px;
        font-weight: 700;
        min-width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--bg-card, white);
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      .dropdown-panel {
        position: absolute;
        top: calc(100% + 15px);
        right: -10px;
        width: 420px;
        max-height: calc(100vh - 120px);
        background: var(--bg-card, white);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        border-radius: 16px;
        border: 1px solid var(--border, rgba(255, 255, 255, 0.15));
        box-shadow:
          0 20px 50px rgba(0, 0, 0, 0.5),
          0 0 0 1px rgba(255, 255, 255, 0.05);
        z-index: 10006;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: slideIn 0.2s cubic-bezier(0, 0, 0.2, 1);
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .dropdown-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--border, #e0e0e0);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.02);
      }

      .dropdown-header h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
      }

      .actions {
        display: flex;
        gap: 8px;
      }

      .text-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border);
        color: var(--primary);
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 8px;
        transition: all 0.2s;
      }

      .text-btn:hover {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }

      .text-btn.danger {
        color: var(--danger);
      }

      .text-btn.danger:hover {
        background: var(--danger);
        color: white;
        border-color: var(--danger);
      }

      .notifications-list {
        overflow-y: auto;
        max-height: 480px;
      }

      .notifications-list::-webkit-scrollbar {
        width: 6px;
      }

      .notifications-list::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 3px;
      }

      .loading,
      .empty-state {
        padding: 40px 20px;
        text-align: center;
        color: var(--text-secondary, #666);
      }

      .notification-item {
        padding: 16px 20px;
        border-bottom: 1px solid var(--border, #e0e0e0);
        display: flex;
        gap: 16px;
        transition: all 0.2s;
        position: relative;
      }

      .notification-item:hover {
        background: rgba(255, 255, 255, 0.03);
      }

      .notification-item.unread {
        background: rgba(var(--primary-glow-rgb, 0, 210, 255), 0.05);
        border-left: 3px solid var(--primary);
      }

      .notification-content {
        flex: 1;
      }

      .notification-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
      }

      .notification-type {
        font-size: 10px;
        text-transform: uppercase;
        color: var(--primary);
        font-weight: 700;
        letter-spacing: 0.5px;
      }

      .notification-time {
        font-size: 11px;
        color: var(--text-muted);
      }

      .notification-content h4 {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-main);
      }

      .notification-content p {
        margin: 0;
        font-size: 13px;
        color: var(--text-muted);
        line-height: 1.4;
      }

      .notification-actions {
        display: flex;
        gap: 6px;
        align-items: flex-start;
      }

      .icon-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border);
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        color: var(--text-muted);
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-btn:hover {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }

      .icon-btn.danger:hover {
        background: var(--danger);
        color: white;
        border-color: var(--danger);
      }
    `,
  ],
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  isOpen = signal(false);
  notifications = signal<Notification[]>([]);
  loading = signal(false);
  unreadCount = this.notificationService.unreadCount;

  ngOnInit (): void {
    this.notificationService.subscribeToNotifications();

    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification: Notification) => {
        this.notifications.update((notifications: Notification[]) => [
          notification,
          ...notifications,
        ]);
      });

    this.loadNotifications();
  }

  ngOnDestroy (): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.notificationService.unsubscribe();
  }

  toggleDropdown (): void {
    this.isOpen.update((open: boolean) => !open);
    if (this.isOpen()) {
      this.loadNotifications();
    }
  }

  loadNotifications (): void {
    this.loading.set(true);
    this.notificationService.getNotifications({ limit: 20 }).subscribe({
      next: (response: { notifications: Notification[]; total: number }) => {
        this.notifications.set(response.notifications);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  markAsRead (id: number): void {
    this.notificationService.markAsRead(id).subscribe({
      next: (updated: Notification) => {
        this.notifications.update((notifications: Notification[]) =>
          notifications.map((n: Notification) => (n.id === id ? updated : n)),
        );
        this.notificationService.unreadCount.update((count: number) => Math.max(0, count - 1));
      },
    });
  }

  markAllAsRead (): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((notifications: Notification[]) =>
          notifications.map((n: Notification) => ({
            ...n,
            isRead: true,
            readAt: new Date().toISOString(),
          })),
        );
        this.notificationService.unreadCount.set(0);
      },
    });
  }

  deleteNotification (id: number): void {
    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        const notification = this.notifications().find((n: Notification) => n.id === id);
        this.notifications.update((notifications: Notification[]) =>
          notifications.filter((n: Notification) => n.id !== id),
        );
        if (notification && !notification.isRead) {
          this.notificationService.unreadCount.update((count: number) => Math.max(0, count - 1));
        }
      },
    });
  }

  deleteAll (): void {
    this.notificationService.deleteAll().subscribe({
      next: () => {
        this.notifications.set([]);
        this.notificationService.unreadCount.set(0);
        this.toastService.show('All notifications deleted', 'success');
      },
      error: () => {
        this.toastService.show('Failed to delete notifications', 'error');
      }
    });
  }

  formatTime (dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}
