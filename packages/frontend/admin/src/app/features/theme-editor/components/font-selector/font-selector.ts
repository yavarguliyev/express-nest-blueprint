import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BaseChangeEvent } from '../../../../core/interfaces/token.interface';

@Component({
  selector: 'app-font-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="font-selector">
      <!-- Font Family Dropdown -->
      <div class="font-dropdown-container">
        <select class="font-dropdown" [value]="currentValue" (change)="onFontChange($event)">
          @for (fontGroup of fontGroups; track fontGroup.category) {
            <optgroup [label]="fontGroup.category">
              @for (font of fontGroup.fonts; track font.value) {
                <option [value]="font.value" [style.font-family]="font.value">
                  {{ font.name }}
                </option>
              }
            </optgroup>
          }
        </select>
      </div>

      <!-- Custom Font Input -->
      <div class="custom-font-container">
        <input
          type="text"
          class="custom-font-input"
          [value]="isCustomFont() ? currentValue : ''"
          [style.font-family]="currentValue"
          (input)="onCustomFontChange($event)"
          (focus)="enableCustomMode()"
          placeholder="Enter custom font family..."
          [class.active]="isCustomFont()"
        />
      </div>

      <!-- Font Preview -->
      <div class="font-preview-container">
        <div class="font-preview-text" [style.font-family]="currentValue">
          The quick brown fox jumps over the lazy dog
        </div>
        <div class="font-info">
          <span class="font-name">{{ getFontDisplayName() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .font-selector {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .font-dropdown-container {
        position: relative;
      }

      .font-dropdown {
        width: 100%;
        padding: 8px 12px;
        background: var(--bg-deep);
        border: 1px solid var(--border);
        border-radius: 6px;
        color: var(--text-main);
        font-size: 0.875rem;
        cursor: pointer;
      }

      .font-dropdown:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(0, 210, 255, 0.2);
      }

      .font-dropdown option {
        background: var(--bg-deep);
        color: var(--text-main);
        padding: 4px 8px;
      }

      .custom-font-container {
        position: relative;
      }

      .custom-font-input {
        width: 100%;
        padding: 8px 12px;
        background: var(--bg-deep);
        border: 1px solid var(--border);
        border-radius: 6px;
        color: var(--text-main);
        font-size: 0.875rem;
        transition: all 0.2s ease;
      }

      /* Force font inheritance for input - removed since we're using style binding */

      .custom-font-input:focus,
      .custom-font-input.active {
        outline: none;
        border-color: var(--primary) !important;
        box-shadow: 0 0 0 2px rgba(0, 210, 255, 0.2) !important;
        background: linear-gradient(135deg, var(--primary), #8b5cf6) !important;
        color: white !important;
      }

      .custom-font-input::placeholder {
        color: var(--text-muted);
        font-style: italic;
      }

      .font-preview-container {
        background: var(--bg-deep);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 1rem;
      }

      .font-preview-text {
        font-size: 0.875rem;
        line-height: 1.4;
        color: var(--text-main);
        margin-bottom: 0.5rem;
        min-height: 1.2em;
      }

      .font-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 0.5rem;
        border-top: 1px solid var(--border);
      }

      .font-name {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-family: 'Monaco', 'Menlo', monospace;
      }

      /* Custom scrollbar for dropdown */
      .font-dropdown {
        scrollbar-width: thin;
        scrollbar-color: var(--border) var(--bg-deep);
      }

      .font-dropdown::-webkit-scrollbar {
        width: 8px;
      }

      .font-dropdown::-webkit-scrollbar-track {
        background: var(--bg-deep);
      }

      .font-dropdown::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 4px;
      }

      .font-dropdown::-webkit-scrollbar-thumb:hover {
        background: var(--text-muted);
      }
    `,
  ],
})
export class FontSelector {
  @Input() tokenId!: string;
  @Input() currentValue!: string;

  @Output() valueChange = new EventEmitter<BaseChangeEvent>();

  customMode = signal(false);

  fontGroups = [
    {
      category: 'System Fonts',
      fonts: [
        {
          name: 'System Default',
          value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        { name: 'San Francisco (macOS)', value: '-apple-system, BlinkMacSystemFont, sans-serif' },
        { name: 'Segoe UI (Windows)', value: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
        { name: 'Roboto (Android)', value: 'Roboto, "Helvetica Neue", Arial, sans-serif' },
      ],
    },
    {
      category: 'Sans Serif',
      fonts: [
        { name: 'Inter', value: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' },
        { name: 'Helvetica Neue', value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
        { name: 'Arial', value: 'Arial, sans-serif' },
        { name: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
        { name: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
        { name: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
      ],
    },
    {
      category: 'Serif',
      fonts: [
        { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
        { name: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
        { name: 'Garamond', value: 'Garamond, "Times New Roman", serif' },
        { name: 'Book Antiqua', value: '"Book Antiqua", Palatino, serif' },
      ],
    },
    {
      category: 'Monospace',
      fonts: [
        { name: 'Monaco', value: 'Monaco, "Lucida Console", monospace' },
        { name: 'Menlo', value: 'Menlo, Monaco, "Courier New", monospace' },
        { name: 'Consolas', value: 'Consolas, "Courier New", monospace' },
        { name: 'Courier New', value: '"Courier New", Courier, monospace' },
        { name: 'Source Code Pro', value: '"Source Code Pro", Monaco, monospace' },
      ],
    },
    {
      category: 'Google Fonts (Popular)',
      fonts: [
        { name: 'Open Sans', value: '"Open Sans", sans-serif' },
        { name: 'Lato', value: '"Lato", sans-serif' },
        { name: 'Montserrat', value: '"Montserrat", sans-serif' },
        { name: 'Roboto', value: '"Roboto", sans-serif' },
        { name: 'Poppins', value: '"Poppins", sans-serif' },
        { name: 'Nunito', value: '"Nunito", sans-serif' },
        { name: 'Playfair Display', value: '"Playfair Display", serif' },
        { name: 'Merriweather', value: '"Merriweather", serif' },
      ],
    },
  ];

  ngOnInit (): void {
    this.checkIfCustomFont();
  }

  onFontChange (event: Event): void {
    const select = event.target as HTMLSelectElement;
    const fontValue = select.value;

    this.customMode.set(false);
    this.emitChange(fontValue);
  }

  onCustomFontChange (event: Event): void {
    const input = event.target as HTMLInputElement;
    const fontValue = input.value.trim();
    if (fontValue) this.emitChange(fontValue);
  }

  enableCustomMode (): void {
    this.customMode.set(true);
  }

  isCustomFont (): boolean {
    return this.customMode() || !this.isPredefinedFont(this.currentValue);
  }

  getFontDisplayName (): string {
    if (this.isCustomFont()) return 'Custom Font';

    for (const group of this.fontGroups) {
      const font = group.fonts.find((f) => f.value === this.currentValue);
      if (font) return font.name;
    }

    return 'Unknown Font';
  }

  private checkIfCustomFont (): void {
    this.customMode.set(!this.isPredefinedFont(this.currentValue));
  }

  private isPredefinedFont (fontValue: string): boolean {
    return this.fontGroups.some((group) => group.fonts.some((font) => font.value === fontValue));
  }

  private emitChange (fontValue: string): void {
    this.valueChange.emit({
      tokenId: this.tokenId,
      value: fontValue,
    });
  }
}
