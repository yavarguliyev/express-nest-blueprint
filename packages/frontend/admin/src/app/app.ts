import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToastComponent } from './shared/components/toast/toast.component';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { ThemeEditorService } from './core/services/theme-editor.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, LoadingComponent],
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
    <app-loading></app-loading>
  `,
})
export class App implements OnInit {
  private themeEditorService = inject(ThemeEditorService);

  ngOnInit (): void {
    this.themeEditorService.loadTokens().subscribe({
      next: () => {},
      error: () => {
        this.themeEditorService.applyCurrentTokens();
      },
    });
  }
}
