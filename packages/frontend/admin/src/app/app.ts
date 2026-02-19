import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './shared/components/toast/toast';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { ThemeEditorService } from './core/services/theme/theme-editor.service';
import { AuthService } from './core/services/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Toast, LoadingComponent],
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
    <app-loading></app-loading>
  `
})
export class App implements OnInit {
  private themeEditorService = inject(ThemeEditorService);
  private authService = inject(AuthService);

  ngOnInit (): void {
    if (this.authService.isLoggedIn()) {
      this.themeEditorService.loadTokens().subscribe({
        next: () => {
          // Tokens loaded and applied successfully
          this.themeEditorService.applyCurrentTokens();
        },
        error: () => {
          // If loading fails, apply default tokens from CSS
          this.themeEditorService.applyCurrentTokens();
        }
      });
    } else {
      // Not logged in, apply default tokens from CSS
      this.themeEditorService.applyCurrentTokens();
    }
  }
}
