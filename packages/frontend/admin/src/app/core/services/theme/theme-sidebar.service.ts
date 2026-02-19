import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeSidebarService {
  private _isCollapsed = signal(false);

  isCollapsed = this._isCollapsed.asReadonly();

  toggle (): void {
    this._isCollapsed.set(!this._isCollapsed());
  }

  collapse (): void {
    this._isCollapsed.set(true);
  }

  expand (): void {
    this._isCollapsed.set(false);
  }
}
