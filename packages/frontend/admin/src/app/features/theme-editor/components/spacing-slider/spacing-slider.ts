import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpacingSliderHelperService, ParsedValue } from './spacing-slider-helper.service';

export interface SpacingChangeEvent {
  tokenId: string;
  value: string;
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
            [min]="getMinValue()"
            [max]="getMaxValue()"
            [step]="getStepValue()"
            [value]="parsedValue().number"
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
            <option *ngFor="let unit of getAvailableUnits()" [value]="unit">
              {{ unit }}
            </option>
          </select>
        </div>
      </div>

      <!-- Preset Values -->
      <div class="presets-container">
        <div class="presets-label">Quick Values:</div>
        <div class="presets-grid">
          <button
            *ngFor="let preset of getPresetValues()"
            type="button"
            class="preset-button"
            [class.active]="currentValue === preset.value"
            (click)="selectPreset(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- Custom Input -->
      <div class="custom-input-container">
        <label class="custom-label">Custom Value:</label>
        <input
          type="text"
          class="custom-input"
          [value]="currentValue"
          (input)="onCustomInput($event)"
          placeholder="e.g., 1.5rem, 20px, 50%"
        />
      </div>
    </div>
  `,
  styles: [`
    .spacing-slider {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--surface-color);
    }

    .value-display {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      background: var(--background-color);
      border-radius: 4px;
    }

    .current-value {
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--primary-color);
    }

    .value-type {
      font-size: 0.875rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .controls-container {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 1rem;
      align-items: center;
    }

    .slider-container {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .spacing-range {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: var(--border-color);
      outline: none;
      cursor: pointer;
    }

    .range-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .numeric-input, .unit-selector, .custom-input {
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--background-color);
      color: var(--text-color);
    }

    .numeric-input {
      width: 80px;
    }

    .unit-selector {
      width: 80px;
      cursor: pointer;
    }

    .presets-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .presets-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .presets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
      gap: 0.5rem;
    }

    .preset-button {
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--background-color);
      color: var(--text-color);
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s ease;
    }

    .preset-button:hover {
      background: var(--hover-color);
    }

    .preset-button.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .custom-input-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .custom-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .custom-input {
      width: 100%;
    }
  `]
})
export class SpacingSlider {
  private helper = inject(SpacingSliderHelperService);

  @Input() currentValue = '0';
  @Input() tokenId = '';
  @Output() valueChange = new EventEmitter<SpacingChangeEvent>();

  parsedValue = computed((): ParsedValue => this.helper.parseValue(this.currentValue));

  getValueType (): string {
    return this.helper.getValueType(this.currentValue);
  }

  getMinValue (): number {
    return this.helper.getMinValue(this.parsedValue().unit);
  }

  getMaxValue (): number {
    return this.helper.getMaxValue(this.parsedValue().unit);
  }

  getStepValue (): number {
    return this.helper.getStepValue(this.parsedValue().unit);
  }

  getAvailableUnits (): string[] {
    return this.helper.getAvailableUnits();
  }

  getPresetValues (): Array<{ label: string; value: string }> {
    return this.helper.getPresetValues(this.parsedValue().unit);
  }

  onSliderChange (event: Event): void {
    const input = event.target as HTMLInputElement;
    const number = parseFloat(input.value);
    const newValue = this.helper.formatValue(number, this.parsedValue().unit);
    this.emitChange(newValue);
  }

  onNumericChange (event: Event): void {
    const input = event.target as HTMLInputElement;
    const number = parseFloat(input.value) || 0;
    const newValue = this.helper.formatValue(number, this.parsedValue().unit);
    this.emitChange(newValue);
  }

  onUnitChange (event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newUnit = select.value;
    const newValue = this.helper.formatValue(this.parsedValue().number, newUnit);
    this.emitChange(newValue);
  }

  onCustomInput (event: Event): void {
    const input = event.target as HTMLInputElement;
    this.emitChange(input.value);
  }

  selectPreset (value: string): void {
    this.emitChange(value);
  }

  private emitChange (value: string): void {
    this.valueChange.emit({
      tokenId: this.tokenId,
      value: value,
    });
  }
}