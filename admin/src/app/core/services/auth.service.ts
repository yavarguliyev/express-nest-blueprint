import { Injectable, inject } from '@angular/core';
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

  login (credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.success && response.data.accessToken) {
          localStorage.setItem('admin_token', response.data.accessToken);
          localStorage.setItem('admin_user', JSON.stringify(response.data.user));
        }
      }),
    );
  }

  logout (): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    void this.router.navigate(['/login']);
  }

  getToken (): string | null {
    return localStorage.getItem('admin_token');
  }

  getCurrentUser (): User | null {
    const userJson = localStorage.getItem('admin_user');
    return userJson ? (JSON.parse(userJson) as User) : null;
  }

  isLoggedIn (): boolean {
    return !!this.getToken();
  }
}
