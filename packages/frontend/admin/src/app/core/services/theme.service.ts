import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'admin-theme-preference';
  
  // Signal for reactive theme state
  private _currentTheme = signal<Theme>(this.getInitialTheme());
  
  // Public readonly signal
  currentTheme = this._currentTheme.asReadonly();
  
  constructor () {
    // Apply theme on initialization and changes
    effect(() => {
      this.applyTheme(this._currentTheme());
    });
  }

  /**
   * Get initial theme from localStorage or default to dark
   */
  private getInitialTheme (): Theme {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.THEME_KEY) as Theme;
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    }
    return 'dark'; // Default to dark mode
  }

  /**
   * Toggle between dark and light themes
   */
  toggleTheme (): void {
    const newTheme: Theme = this._currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Set specific theme
   */
  setTheme (theme: Theme): void {
    this._currentTheme.set(theme);
    this.saveToStorage(theme);
  }

  /**
   * Check if current theme is dark
   */
  isDarkMode (): boolean {
    return this._currentTheme() === 'dark';
  }

  /**
   * Check if current theme is light
   */
  isLightMode (): boolean {
    return this._currentTheme() === 'light';
  }

  /**
   * Apply theme to document
   */
  private applyTheme (theme: Theme): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      document.body.classList.add(`theme-${theme}`);
    }
  }

  /**
   * Save theme preference to localStorage
   */
  private saveToStorage (theme: Theme): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.THEME_KEY, theme);
    }
  }

  /**
   * Get theme for external use (e.g., API calls in future)
   */
  getThemePreference (): Theme {
    return this._currentTheme();
  }
}