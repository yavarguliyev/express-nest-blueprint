import { signal, Signal } from '@angular/core';

export class FontModeManager {
  private customMode = signal(false);

  getCustomMode (): Signal<boolean> {
    return this.customMode.asReadonly();
  }

  enableCustomMode (): void {
    this.customMode.set(true);
  }

  disableCustomMode (): void {
    this.customMode.set(false);
  }

  setCustomMode (isCustom: boolean): void {
    this.customMode.set(isCustom);
  }
}
