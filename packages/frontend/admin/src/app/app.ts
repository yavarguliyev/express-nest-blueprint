import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './shared/components/toast/toast';
import { ThemeEditorService } from './core/services/theme-editor.service';

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

  ngOnInit(): void {
    this.themeEditorService.loadTokens().subscribe();
  }
}
