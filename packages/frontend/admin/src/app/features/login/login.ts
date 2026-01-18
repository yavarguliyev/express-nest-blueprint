import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface ErrorResponse {
  error?: {
    message?: string;
  };
  message?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  async onSubmit () {
    this.loading.set(true);
    this.error.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: async (res) => {
        if (res.success) {
          // Sync profile to ensure we have complete user data
          await this.authService.syncProfile();
          void this.router.navigate(['/dashboard']);
        } else {
          this.error.set('Login failed. Please check your credentials.');
        }
        this.loading.set(false);
      },
      error: (err: ErrorResponse) => {
        this.error.set(err.error?.message || err.message || 'An error occurred during login.');
        this.loading.set(false);
      },
    });
  }
}
