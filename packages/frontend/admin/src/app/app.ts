import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './shared/components/toast/toast';
import { ThemeEditorService, CssToken } from './core/services/theme-editor.service';
import { GlobalCacheService } from './core/services/global-cache.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Toast],
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
  `,
})
export class App implements OnInit {
  private themeEditorService = inject(ThemeEditorService);
  private cacheService = inject(GlobalCacheService);

  ngOnInit (): void {
    const cachedTokens = this.cacheService.get<CssToken[]>('css-tokens');
    if (cachedTokens && cachedTokens.length > 0) {
      this.themeEditorService.setTokens(cachedTokens);
    } else {
      this.themeEditorService.loadTokens().subscribe({
        next: () => {},
        error: () => {
          this.themeEditorService.applyCurrentTokens();
        },
      });
    }

    setInterval(() => {
      this.cacheService.cleanup();
    }, 60000);
  }
}
