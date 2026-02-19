import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth/auth.service';
import { ThemeEditorService } from '../../core/services/theme/theme-editor.service';
import { PasswordInput } from '../../shared/components/password-input/password-input';
import { ErrorResponse } from '../../core/interfaces/common.interface';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, PasswordInput],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private authService = inject(AuthService);
  private themeEditorService = inject(ThemeEditorService);
  private router = inject(Router);

  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  onSubmit(): void {
    this.loading.set(true);
    this.error.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: res => {
        if (res.success) {
          // Load tokens immediately after login
          this.themeEditorService.loadTokens().subscribe({
            next: () => {
              // Apply tokens to CSS
              this.themeEditorService.applyCurrentTokens();

              // Then sync profile and navigate
              this.authService
                .syncProfile()
                .then(() => {
                  this.loading.set(false);
                  void this.router.navigate(['/dashboard']);
                })
                .catch(() => {
                  this.loading.set(false);
                  void this.router.navigate(['/dashboard']);
                });
            },
            error: () => {
              // If token loading fails, still navigate
              this.authService
                .syncProfile()
                .then(() => {
                  this.loading.set(false);
                  void this.router.navigate(['/dashboard']);
                })
                .catch(() => {
                  this.loading.set(false);
                  void this.router.navigate(['/dashboard']);
                });
            }
          });
        } else {
          this.error.set('Login failed. Please check your credentials.');
          this.loading.set(false);
        }
      },
      error: (err: ErrorResponse) => {
        this.error.set(err.error?.message || err.message || 'An error occurred during login.');
        this.loading.set(false);
      }
    });
  }
}
