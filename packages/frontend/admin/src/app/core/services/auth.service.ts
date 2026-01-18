import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = '/api/v1/auth';
  private apiUrl = '/api/v1';

  currentUser = signal<User | null>(this.getCurrentUserFromStorage());

  login (credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/admin-login`, credentials).pipe(
      tap((response) => {
        console.log('Login response:', response); // Debug log
        if (response.success && response.data.accessToken) {
          console.log('User data from login:', response.data.user); // Debug log
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

  // Deprecated: existing code might use this, but we prefer the signal
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

  async syncProfile (): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/admin/profile?t=${Date.now()}`, {
        headers: this.getHeaders()
      });
      if (response.ok) {
        const json = await response.json() as { data?: User } | User;
        console.log('Profile sync response:', json); // Debug log
        const userData = this.isUserResponse(json) ? json : (json as { data: User }).data;
        console.log('Processed user data:', userData); // Debug log
        this.updateCurrentUser(userData);
      }
    } catch (e) {
      console.error('Failed to sync profile', e);
    }
  }

  private isUserResponse (obj: unknown): obj is User {
    return typeof obj === 'object' && obj !== null && 'id' in obj && 'email' in obj;
  }

  async uploadAvatar (file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    try {
      const response = await fetch(`${this.apiUrl}/admin/profile/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        await this.syncProfile();
      } else {
        throw new Error('Upload failed');
      }
    } catch (e) {
      console.error('Upload error', e);
      throw e;
    }
  }

  async deleteAvatar (): Promise<void> {
    const token = this.getToken();
    try {
      const response = await fetch(`${this.apiUrl}/admin/profile/image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await this.syncProfile();
      }
    } catch (e) {
      console.error('Delete error', e);
      throw e;
    }
  }

  private getHeaders (): HeadersInit {
    const token = this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}
