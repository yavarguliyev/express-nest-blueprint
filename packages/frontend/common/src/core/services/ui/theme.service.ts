import { Injectable, signal, effect, Signal } from '@angular/core';

import { Theme } from '../../../domain/types/theme.type';

@Injectable()
export class ThemeService {
  private readonly THEME_KEY: string;

  private _currentTheme = signal<Theme>(this.getInitialTheme());
  currentTheme: Signal<Theme> = this._currentTheme.asReadonly();

  constructor (storageKey: string = 'theme-preference') {
    this.THEME_KEY = storageKey;
    effect(() => {
      this.applyTheme(this._currentTheme());
    });
  }

  private getInitialTheme (): Theme {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.THEME_KEY) as Theme;
      if (stored === 'dark' || stored === 'light') return stored;
    }

    return 'dark';
  }

  toggleTheme (): void {
    const newTheme: Theme = this._currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  setTheme (theme: Theme): void {
    this._currentTheme.set(theme);
    this.saveToStorage(theme);
  }

  isDarkMode (): boolean {
    return this._currentTheme() === 'dark';
  }

  isLightMode (): boolean {
    return this._currentTheme() === 'light';
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

  getThemePreference (): Theme {
    return this._currentTheme();
  }
}
