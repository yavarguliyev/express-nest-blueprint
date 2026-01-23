import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  entityId: number | null;
  entityType: string | null;
  recipientId: number;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
}

import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private eventSource: EventSource | null = null;
  private notificationSubject = new Subject<Notification>();
  public notifications$ = this.notificationSubject.asObservable();
  public unreadCount = signal<number>(0);

  constructor (
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getNotifications (params?: {
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }): Observable<NotificationsResponse> {
    return this.http
      .get<{ data: NotificationsResponse }>(API_ENDPOINTS.NOTIFICATIONS.BASE, {
        params: params as Record<string, string>,
      })
      .pipe(map((response) => response.data));
  }

  getUnreadCount (): Observable<{ count: number }> {
    return this.http
      .get<{ data: { count: number } }>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT)
      .pipe(map((response) => response.data));
  }

  markAsRead (id: number): Observable<Notification> {
    return this.http
      .patch<{ data: Notification }>(API_ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(id), {})
      .pipe(map((response) => response.data));
  }

  markAllAsRead (): Observable<{ updated: number }> {
    return this.http
      .patch<{ data: { updated: number } }>(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ, {})
      .pipe(map((response) => response.data));
  }

  deleteNotification (id: number): Observable<{ success: boolean }> {
    return this.http
      .delete<{ data: { success: boolean } }>(API_ENDPOINTS.NOTIFICATIONS.DELETE(id))
      .pipe(map((response) => response.data));
  }

  deleteAll (): Observable<{ success: boolean; deletedCount: number }> {
    return this.http
      .delete<{ data: { success: boolean; deletedCount: number } }>(API_ENDPOINTS.NOTIFICATIONS.DELETE_ALL)
      .pipe(map((response) => response.data));
  }

  subscribeToNotifications (): void {
    if (this.eventSource) return;

    const token = this.authService.getToken();
    this.eventSource = new EventSource(`${API_ENDPOINTS.NOTIFICATIONS.STREAM}?token=${token}`);

    this.eventSource.onmessage = (event: MessageEvent) => {
      const notification = JSON.parse(event.data as string) as Notification;
      this.notificationSubject.next(notification);
      this.unreadCount.update((count) => count + 1);
    };

    this.eventSource.onerror = () => {
      this.unsubscribe();
      setTimeout(() => this.subscribeToNotifications(), 5000);
    };

    this.loadUnreadCount();
  }

  unsubscribe (): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  private loadUnreadCount (): void {
    this.getUnreadCount().subscribe({
      next: (response) => this.unreadCount.set(response.count),
      error: () => this.unreadCount.set(0),
    });
  }
}
