import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FontChangeEvent } from '../../../../core/interfaces/theme.interface';
import { FontGroupsProvider } from './helpers/font-groups-provider';
import { FontDetector } from './helpers/font-detector';
import { FontModeManager } from './helpers/font-mode-manager';

@Component({
  selector: 'app-font-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './font-selector.html',
  styleUrl: './font-selector.css'
})
export class FontSelector {
  @Input() tokenId!: string;
  @Input() currentValue!: string;

  @Output() valueChange = new EventEmitter<FontChangeEvent>();

  private groupsProvider = new FontGroupsProvider();
  private modeManager = new FontModeManager();
  private detector!: FontDetector;

  fontGroups = this.groupsProvider.getFontGroups();
  customMode = this.modeManager.getCustomMode();

  ngOnInit (): void {
    this.detector = new FontDetector(this.fontGroups);
    this.checkIfCustomFont();
  }

  onFontChange (event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.modeManager.disableCustomMode();
    this.emitChange(select.value);
  }

  onCustomFontChange (event: Event): void {
    const input = event.target as HTMLInputElement;
    const fontValue = input.value.trim();
    if (fontValue) this.emitChange(fontValue);
  }

  enableCustomMode (): void {
    this.modeManager.enableCustomMode();
  }

  isCustomFont (): boolean {
    return this.customMode() || !this.detector.isPredefinedFont(this.currentValue);
  }

  getFontDisplayName (): string {
    if (this.isCustomFont()) return 'Custom Font';
    return this.detector.getFontDisplayName(this.currentValue);
  }

  private checkIfCustomFont (): void {
    this.modeManager.setCustomMode(!this.detector.isPredefinedFont(this.currentValue));
  }

  private emitChange (fontValue: string): void {
    this.valueChange.emit({
      tokenId: this.tokenId,
      value: fontValue
    });
  }
}
