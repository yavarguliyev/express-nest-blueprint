import { Injectable, signal, effect } from '@angular/core';

import { Theme } from '../../enums/theme.enum';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'admin-theme-preference';

  private _currentTheme = signal<Theme>(this.getInitialTheme());
  currentTheme = this._currentTheme.asReadonly();

  constructor () {
    effect(() => this.applyTheme(this._currentTheme()));
  }

  toggleTheme (): void {
    const newTheme: Theme = this._currentTheme() === Theme.DARK ? Theme.LIGHT : Theme.DARK;
    this.setTheme(newTheme);
  }

  setTheme (theme: Theme): void {
    this._currentTheme.set(theme);
    this.saveToStorage(theme);
  }

  isDarkMode (): boolean {
    return this._currentTheme() === Theme.DARK;
  }

  isLightMode (): boolean {
    return this._currentTheme() === Theme.LIGHT;
  }

  getThemePreference (): Theme {
    return this._currentTheme();
  }

  private getInitialTheme (): Theme {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.THEME_KEY);
      if (stored === Theme.DARK || stored === Theme.LIGHT) return stored as Theme;
    }

    return Theme.DARK;
  }

  private applyTheme (theme: Theme): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      document.body.classList.add(`theme-${theme}`);
    }
  }

  private saveToStorage (theme: Theme): void {
    if (typeof window !== 'undefined') localStorage.setItem(this.THEME_KEY, theme);
  }
}
