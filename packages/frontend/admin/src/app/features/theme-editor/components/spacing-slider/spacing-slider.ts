import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SpacingChangeEvent {
  tokenId: string;
  value: string;
}

interface ParsedValue {
  number: number;
  unit: string;
}

@Component({
  selector: 'app-spacing-slider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="spacing-slider">
      <!-- Value Display -->
      <div class="value-display">
        <span class="current-value">{{ currentValue }}</span>
        <span class="value-type">{{ getValueType() }}</span>
      </div>

      <!-- Slider and Input Controls -->
      <div class="controls-container">
        <!-- Numeric Slider -->
        <div class="slider-container">
          <input
            type="range"
            class="spacing-range"
            [min]="getMinValue()"
            [max]="getMaxValue()"
            [step]="getStepValue()"
            [value]="parsedValue().number"
            (input)="onSliderChange($event)"
          />

          <div class="range-labels">
            <span class="range-min">{{ getMinValue() }}</span>
            <span class="range-max">{{ getMaxValue() }}</span>
          </div>
        </div>

        <!-- Numeric Input -->
        <div class="numeric-input-container">
          <input
            type="number"
            class="numeric-input"
            [value]="parsedValue().number"
            [min]="getMinValue()"
            [max]="getMaxValue()"
            [step]="getStepValue()"
            (input)="onNumericChange($event)"
          />
        </div>

        <!-- Unit Selector -->
        <div class="unit-selector-container">
          <select
            class="unit-selector"
            [value]="parsedValue().unit"
            (change)="onUnitChange($event)"
          >
            @for (unit of availableUnits; track unit.value) {
              <option [value]="unit.value">{{ unit.label }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Preset Values -->
      <div class="preset-values">
        <div class="presets-label">Quick Values:</div>
        <div class="preset-buttons">
          @for (preset of getPresetValues(); track preset) {
            <button
              class="preset-button"
              [class.active]="currentValue === preset"
              (click)="selectPreset(preset)"
              [title]="preset"
            >
              {{ preset }}
            </button>
          }
        </div>
      </div>

      <!-- Visual Preview -->
      <div class="visual-preview">
        <div class="preview-label">Preview:</div>
        <div class="preview-container">
          @switch (getPreviewType()) {
            @case ('width') {
              <div class="width-preview">
                <div class="width-indicator" [style.width]="currentValue"></div>
              </div>
            }
            @case ('height') {
              <div class="height-preview">
                <div class="height-indicator" [style.height]="currentValue"></div>
              </div>
            }
            @case ('padding') {
              <div class="padding-preview">
                <div class="padding-box" [style.padding]="currentValue">Content</div>
              </div>
            }
            @case ('margin') {
              <div class="margin-preview">
                <div class="margin-box" [style.margin]="currentValue">Element</div>
              </div>
            }
            @case ('border-radius') {
              <div class="radius-preview">
                <div class="radius-box" [style.border-radius]="currentValue"></div>
              </div>
            }
            @default {
              <div class="generic-preview">
                <div
                  class="generic-indicator"
                  [style.width]="currentValue"
                  [style.height]="'4px'"
                ></div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .spacing-slider {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .value-display {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: var(--bg-deep);
        border: 1px solid var(--border);
        border-radius: 6px;
      }

      .current-value {
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.875rem;
        color: var(--text-main);
        font-weight: 600;
      }

      .value-type {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .controls-container {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 0.75rem;
        align-items: center;
      }

      .slider-container {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .spacing-range {
        width: 100%;
        height: 4px;
        background: var(--bg-deep);
        border-radius: 2px;
        outline: none;
        cursor: pointer;
      }

      .spacing-range::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        background: var(--primary);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .spacing-range::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: var(--primary);
        border-radius: 50%;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .range-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.625rem;
        color: var(--text-muted);
      }

      .numeric-input-container {
        width: 80px;
      }

      .numeric-input {
        width: 100%;
        padding: 6px 8px;
        background: var(--bg-deep);
        border: 1px solid var(--border);
        border-radius: 4px;
        color: var(--text-main);
        font-size: 0.75rem;
        text-align: center;
      }

      .numeric-input:focus {
        outline: none;
        border-color: var(--primary);
      }

      .unit-selector-container {
        width: 60px;
      }

      .unit-selector {
        width: 100%;
        padding: 6px 4px;
        background: var(--bg-deep);
        border: 1px solid var(--border);
        border-radius: 4px;
        color: var(--text-main);
        font-size: 0.75rem;
        cursor: pointer;
      }

      .unit-selector:focus {
        outline: none;
        border-color: var(--primary);
      }

      .preset-values {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .presets-label {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-weight: 500;
      }

      .preset-buttons {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
      }

      .preset-button {
        background: var(--bg-deep);
        border: 1px solid var(--border);
        color: var(--text-muted);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.625rem;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Monaco', 'Menlo', monospace;
      }

      .preset-button:hover {
        background: var(--border);
        color: var(--text-main);
      }

      .preset-button.active {
        background: linear-gradient(135deg, var(--primary), #8b5cf6) !important;
        border: 1px solid var(--primary) !important;
        color: white !important;
        box-shadow: 0 4px 15px var(--primary-glow) !important;
      }

      .visual-preview {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .preview-label {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-weight: 500;
      }

      .preview-container {
        background: var(--bg-deep);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 1rem;
        min-height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Preview Styles */
      .width-preview {
        width: 100%;
        display: flex;
        align-items: center;
      }

      .width-indicator {
        height: 4px;
        background: var(--primary);
        border-radius: 2px;
        min-width: 2px;
      }

      .height-preview {
        display: flex;
        justify-content: center;
        align-items: flex-end;
        height: 40px;
      }

      .height-indicator {
        width: 20px;
        background: var(--primary);
        border-radius: 2px;
        min-height: 2px;
      }

      .padding-preview {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .padding-box {
        background: var(--primary);
        color: white;
        font-size: 0.75rem;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 60px;
        min-height: 30px;
      }

      .margin-preview {
        background: var(--border);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .margin-box {
        background: var(--primary);
        color: white;
        font-size: 0.75rem;
        border-radius: 4px;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .radius-preview {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .radius-box {
        width: 40px;
        height: 40px;
        background: var(--primary);
      }

      .generic-preview {
        width: 100%;
        display: flex;
        align-items: center;
      }

      .generic-indicator {
        background: var(--primary);
        border-radius: 2px;
        min-width: 2px;
      }
    `,
  ],
})
export class SpacingSlider {
  @Input() tokenId!: string;
  @Input() currentValue!: string;
  @Input() tokenName!: string;

  @Output() valueChange = new EventEmitter<SpacingChangeEvent>();

  availableUnits = [
    { value: 'px', label: 'px' },
    { value: 'rem', label: 'rem' },
    { value: 'em', label: 'em' },
    { value: '%', label: '%' },
    { value: 'vh', label: 'vh' },
    { value: 'vw', label: 'vw' },
  ];

  parsedValue = computed(() => this.parseValue(this.currentValue));

  parseValue (value: string): ParsedValue {
    const match = value?.match(/^(-?\d*\.?\d+)(.*)$/);
    if (match && match[1]) {
      return {
        number: parseFloat(match[1]) || 0,
        unit: match[2]?.trim() || 'px',
      };
    }
    return { number: 0, unit: 'px' };
  }

  getMinValue (): number {
    const unit = this.parsedValue().unit;
    switch (unit) {
      case '%':
        return 0;
      case 'rem':
      case 'em':
        return 0;
      case 'vh':
      case 'vw':
        return 0;
      default:
        return 0;
    }
  }

  getMaxValue (): number {
    const unit = this.parsedValue().unit;
    switch (unit) {
      case '%':
        return 100;
      case 'rem':
      case 'em':
        return 10;
      case 'vh':
      case 'vw':
        return 100;
      default:
        return 500;
    }
  }

  getStepValue (): number {
    const unit = this.parsedValue().unit;
    switch (unit) {
      case '%':
        return 1;
      case 'rem':
      case 'em':
        return 0.1;
      case 'vh':
      case 'vw':
        return 1;
      default:
        return 1;
    }
  }

  getValueType (): string {
    const tokenName = this.tokenName.toLowerCase();

    if (tokenName.includes('width')) return 'width';
    if (tokenName.includes('height')) return 'height';
    if (tokenName.includes('padding')) return 'padding';
    if (tokenName.includes('margin')) return 'margin';
    if (tokenName.includes('radius')) return 'border-radius';
    if (tokenName.includes('spacing')) return 'spacing';

    return 'size';
  }

  getPreviewType (): string {
    return this.getValueType();
  }

  getPresetValues (): string[] {
    const unit = this.parsedValue().unit;

    switch (unit) {
      case 'rem':
        return ['0rem', '0.25rem', '0.5rem', '0.75rem', '1rem', '1.5rem', '2rem', '3rem', '4rem'];
      case 'em':
        return ['0em', '0.25em', '0.5em', '0.75em', '1em', '1.5em', '2em', '3em'];
      case '%':
        return ['0%', '25%', '50%', '75%', '100%'];
      case 'vh':
        return ['0vh', '10vh', '25vh', '50vh', '75vh', '100vh'];
      case 'vw':
        return ['0vw', '10vw', '25vw', '50vw', '75vw', '100vw'];
      default:
        return ['0px', '4px', '8px', '12px', '16px', '24px', '32px', '48px', '64px'];
    }
  }

  onSliderChange (event: Event): void {
    const input = event.target as HTMLInputElement;
    const number = parseFloat(input.value);
    const unit = this.parsedValue().unit;
    const newValue = `${number}${unit}`;
    this.emitChange(newValue);
  }

  onNumericChange (event: Event): void {
    const input = event.target as HTMLInputElement;
    const number = parseFloat(input.value) || 0;
    const unit = this.parsedValue().unit;
    const newValue = `${number}${unit}`;
    this.emitChange(newValue);
  }

  onUnitChange (event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newUnit = select.value;
    const number = this.parsedValue().number;
    const newValue = `${number}${newUnit}`;
    this.emitChange(newValue);
  }

  selectPreset (preset: string): void {
    this.emitChange(preset);
  }

  private emitChange (value: string): void {
    this.valueChange.emit({
      tokenId: this.tokenId,
      value: value,
    });
  }
}
