import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorChangeEvent } from '../../../../core/interfaces/token.interface';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="color-picker">
      <!-- Mode Tabs -->
      <div class="mode-tabs">
        <button
          class="mode-tab"
          [class.active]="selectedMode() === 'default'"
          (click)="selectMode('default')"
        >
          Default
        </button>
        <button
          class="mode-tab"
          [class.active]="selectedMode() === 'light'"
          (click)="selectMode('light')"
        >
          Light
        </button>
        <button
          class="mode-tab"
          [class.active]="selectedMode() === 'dark'"
          (click)="selectMode('dark')"
        >
          Dark
        </button>
      </div>

      <!-- Color Input -->
      <div class="color-input-container">
        <div class="color-preview-wrapper">
          <input
            type="color"
            class="color-input"
            [value]="getCurrentValue()"
            (input)="onColorChange($event)"
            [title]="getCurrentValue()"
          />
          <div
            class="color-preview"
            [style.background-color]="getCurrentValue()"
            (click)="triggerColorPicker()"
          ></div>
        </div>

        <input
          type="text"
          class="color-text-input"
          [value]="getCurrentValue()"
          (input)="onTextChange($event)"
          (blur)="validateColor($event)"
          placeholder="#000000"
          pattern="^#[0-9A-Fa-f]{6}$"
        />
      </div>

      <!-- Color Presets -->
      <div class="color-presets">
        <div class="presets-label">Quick Colors:</div>
        <div class="preset-colors">
          @for (color of colorPresets; track color) {
            <button
              class="preset-color"
              [style.background-color]="color"
              [title]="color"
              (click)="selectPresetColor(color)"
            ></button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .color-picker {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .mode-tabs {
        display: flex;
        background: var(--bg-deep);
        border-radius: 6px;
        padding: 2px;
        border: 1px solid var(--border);
      }

      .mode-tab {
        flex: 1;
        background: none;
        border: none;
        padding: 6px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
        color: var(--text-muted);
      }

      .mode-tab:hover {
        background: var(--border);
        color: var(--text-main);
      }

      .mode-tab.active {
        background: linear-gradient(135deg, var(--primary), #8b5cf6) !important;
        color: white !important;
        border: 1px solid var(--primary) !important;
        box-shadow: 0 4px 15px var(--primary-glow) !important;
      }

      .color-input-container {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .color-preview-wrapper {
        position: relative;
        width: 40px;
        height: 32px;
      }

      .color-input {
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
      }

      .color-preview {
        width: 100%;
        height: 100%;
        border-radius: 6px;
        border: 2px solid var(--border);
        cursor: pointer;
        transition: border-color 0.2s ease;
      }

      .color-preview:hover {
        border-color: var(--primary);
      }

      .color-text-input {
        flex: 1;
        padding: 6px 8px;
        background: var(--bg-deep);
        border: 1px solid var(--border);
        border-radius: 4px;
        color: var(--text-main);
        font-size: 0.75rem;
        font-family: 'Monaco', 'Menlo', monospace;
      }

      .color-text-input:focus {
        outline: none;
        border-color: var(--primary);
      }

      .color-text-input:invalid {
        border-color: var(--danger);
      }

      .color-presets {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .presets-label {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-weight: 500;
      }

      .preset-colors {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
      }

      .preset-color {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        border: 1px solid var(--border);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .preset-color:hover {
        transform: scale(1.1);
        border-color: var(--primary);
      }
    `,
  ],
})
export class ColorPicker {
  @Input() tokenId!: string;
  @Input() currentValue!: string;
  @Input() lightValue!: string;
  @Input() darkValue!: string;
  @Input() currentMode: 'light' | 'dark' = 'dark';

  @Output() valueChange = new EventEmitter<ColorChangeEvent>();

  selectedMode = signal<'default' | 'light' | 'dark'>('default');

  colorPresets = [
    '#000000',
    '#ffffff',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff',
    '#ffa500',
    '#800080',
    '#008000',
    '#000080',
    '#808080',
    '#c0c0c0',
    '#800000',
  ];

  ngOnInit (): void {
    this.selectedMode.set(this.currentMode === 'light' ? 'light' : 'dark');
  }

  selectMode (mode: 'default' | 'light' | 'dark'): void {
    this.selectedMode.set(mode);
  }

  getCurrentValue (): string {
    const mode = this.selectedMode();
    switch (mode) {
      case 'light':
        return this.lightValue || this.currentValue;
      case 'dark':
        return this.darkValue || this.currentValue;
      default:
        return this.currentValue;
    }
  }

  onColorChange (event: Event): void {
    const input = event.target as HTMLInputElement;
    const color = input.value;
    this.emitChange(color);
  }

  onTextChange (event: Event): void {
    const input = event.target as HTMLInputElement;
    const color = input.value;
    if (this.isValidColor(color)) {
      this.emitChange(color);
    }
  }

  validateColor (event: Event): void {
    const input = event.target as HTMLInputElement;
    const color = input.value;

    if (!this.isValidColor(color)) {
      input.value = this.getCurrentValue();
    }
  }

  selectPresetColor (color: string): void {
    this.emitChange(color);
  }

  triggerColorPicker (): void {}

  private emitChange (color: string): void {
    const mode = this.selectedMode();
    this.valueChange.emit({
      tokenId: this.tokenId,
      value: color,
      mode: mode === 'default' ? 'default' : mode,
    });
  }

  private isValidColor (color: string): boolean {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    if (hexPattern.test(color)) return true;

    const rgbPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/;
    if (rgbPattern.test(color)) return true;

    const hslPattern = /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/;
    if (hslPattern.test(color)) return true;

    const namedColors = ['red', 'green', 'blue', 'white', 'black', 'transparent'];
    if (namedColors.includes(color.toLowerCase())) return true;

    return false;
  }
}
