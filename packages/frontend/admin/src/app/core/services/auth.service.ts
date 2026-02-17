import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, firstValueFrom } from 'rxjs';
import { LoadingService } from '@app/common';

import { API_ENDPOINTS } from '../constants/api-endpoints';
import { User, LoginCredentials, AuthResponse } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  currentUser = signal<User | null>(this.getCurrentUserFromStorage());

  login (credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials).pipe(
      tap((response) => {
        if (response.success && response.data.accessToken) {
          localStorage.setItem('auth_token', response.data.accessToken);
          localStorage.setItem('user_data', JSON.stringify(response.data.user));
          this.currentUser.set(response.data.user);
        }
      }),
    );
  }

  logout (): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    this.currentUser.set(null);
    void this.router.navigate(['/login']);
  }

  getToken (): string | null {
    return localStorage.getItem('auth_token');
  }

  private getCurrentUserFromStorage (): User | null {
    const userJson = localStorage.getItem('user_data');
    return userJson ? (JSON.parse(userJson) as User) : null;
  }

  getCurrentUser (): User | null {
    return this.currentUser();
  }

  isLoggedIn (): boolean {
    return !!this.getToken();
  }

  updateCurrentUser (user: User): void {
    localStorage.setItem('user_data', JSON.stringify(user));
    this.currentUser.set(user);
  }

  async syncProfile (): Promise<void> {
    const response = await firstValueFrom(
      this.http.get<{ data?: User } | User>(`${API_ENDPOINTS.AUTH.PROFILE}?t=${Date.now()}`),
    );

    const userData = this.isUserResponse(response) ? response : (response as { data: User }).data;

    this.updateCurrentUser(userData);
  }

  private isUserResponse (obj: unknown): obj is User {
    return typeof obj === 'object' && obj !== null && 'id' in obj && 'email' in obj;
  }

  async uploadAvatar (file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    this.loadingService.show('Uploading avatar...');
    try {
      await firstValueFrom(this.http.post(API_ENDPOINTS.AUTH.UPLOAD_AVATAR, formData));
      await this.syncProfile();
    } finally {
      this.loadingService.hide();
    }
  }

  async deleteAvatar (): Promise<void> {
    this.loadingService.show('Removing avatar...');
    try {
      await firstValueFrom(this.http.delete(API_ENDPOINTS.AUTH.DELETE_AVATAR));
      await this.syncProfile();
    } finally {
      this.loadingService.hide();
    }
  }
}
