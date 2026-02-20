import { signal, Signal } from '@angular/core';

export class ColorModeManager {
  private selectedMode = signal<'default' | 'light' | 'dark'>('default');

  getSelectedMode (): Signal<'default' | 'light' | 'dark'> {
    return this.selectedMode.asReadonly();
  }

  selectMode (mode: 'default' | 'light' | 'dark'): void {
    this.selectedMode.set(mode);
  }

  getCurrentValue (currentValue: string, lightValue: string, darkValue: string): string {
    const mode = this.selectedMode();
    switch (mode) {
      case 'light':
        return lightValue || currentValue;
      case 'dark':
        return darkValue || currentValue;
      default:
        return currentValue;
    }
  }

  initializeFromCurrentMode (currentMode: 'light' | 'dark'): void {
    this.selectedMode.set(currentMode === 'light' ? 'light' : 'dark');
  }
}
