import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, firstValueFrom } from 'rxjs';
import { GlobalCacheService } from './global-cache.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface User {
  id: number;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: User;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cacheService = inject(GlobalCacheService);

  currentUser = signal<User | null>(this.getCurrentUserFromStorage());

  login (credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials).pipe(
      tap((response) => {
        if (response.success && response.data.accessToken) {
          localStorage.setItem('admin_token', response.data.accessToken);
          localStorage.setItem('admin_user', JSON.stringify(response.data.user));
          this.currentUser.set(response.data.user);
        }
      }),
    );
  }

  logout (): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    this.currentUser.set(null);
    void this.router.navigate(['/login']);
  }

  getToken (): string | null {
    return localStorage.getItem('admin_token');
  }

  private getCurrentUserFromStorage (): User | null {
    const userJson = localStorage.getItem('admin_user');
    return userJson ? (JSON.parse(userJson) as User) : null;
  }

  getCurrentUser (): User | null {
    return this.currentUser();
  }

  isLoggedIn (): boolean {
    return !!this.getToken();
  }

  updateCurrentUser (user: User): void {
    localStorage.setItem('admin_user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  async syncProfile (forceRefresh: boolean = false): Promise<void> {
    if (!forceRefresh) {
      const cachedProfile = this.cacheService.get<User>('user-profile');
      if (cachedProfile) {
        this.updateCurrentUser(cachedProfile);
        return;
      }
    }

    const response = await firstValueFrom(
      this.http.get<{ data?: User } | User>(`${API_ENDPOINTS.AUTH.PROFILE}?t=${Date.now()}`)
    );

    const userData = this.isUserResponse(response) ? response : (response as { data: User }).data;

    this.cacheService.set('user-profile', userData, 5 * 60 * 1000);
    this.updateCurrentUser(userData);
  }

  private isUserResponse (obj: unknown): obj is User {
    return typeof obj === 'object' && obj !== null && 'id' in obj && 'email' in obj;
  }

  async uploadAvatar (file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    await firstValueFrom(this.http.post(API_ENDPOINTS.AUTH.UPLOAD_AVATAR, formData));
    await this.syncProfile(true);
  }

  async deleteAvatar (): Promise<void> {
    await firstValueFrom(this.http.delete(API_ENDPOINTS.AUTH.DELETE_AVATAR));
    await this.syncProfile(true);
  }
}
