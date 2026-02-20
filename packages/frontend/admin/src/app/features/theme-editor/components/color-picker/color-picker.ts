import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ColorChangeEvent } from '../../../../core/interfaces/theme.interface';
import { ColorValidator } from './helpers/color-validator';
import { ColorPresetProvider } from './helpers/color-preset-provider';
import { ColorModeManager } from './helpers/color-mode-manager';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.css'
})
export class ColorPicker {
  @Input() tokenId!: string;
  @Input() currentValue!: string;
  @Input() lightValue!: string;
  @Input() darkValue!: string;
  @Input() currentMode: 'light' | 'dark' = 'dark';

  @Output() valueChange = new EventEmitter<ColorChangeEvent>();

  private validator = new ColorValidator();
  private presetProvider = new ColorPresetProvider();
  private modeManager = new ColorModeManager();

  colorPresets = this.presetProvider.getPresets();
  selectedMode = this.modeManager.getSelectedMode();

  triggerColorPicker (): void {}

  ngOnInit (): void {
    this.modeManager.initializeFromCurrentMode(this.currentMode);
  }

  selectMode (mode: 'default' | 'light' | 'dark'): void {
    this.modeManager.selectMode(mode);
  }

  getCurrentValue (): string {
    return this.modeManager.getCurrentValue(this.currentValue, this.lightValue, this.darkValue);
  }

  onColorChange (event: Event): void {
    const input = event.target as HTMLInputElement;
    this.emitChange(input.value);
  }

  onTextChange (event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.validator.isValidColor(input.value)) {
      this.emitChange(input.value);
    }
  }

  validateColor (event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = this.validator.validateAndCorrect(input.value, this.getCurrentValue());
  }

  selectPresetColor (color: string): void {
    this.emitChange(color);
  }

  private emitChange (color: string): void {
    const mode = this.selectedMode();
    this.valueChange.emit({
      tokenId: this.tokenId,
      value: color,
      mode: mode === 'default' ? 'default' : mode
    });
  }
}
