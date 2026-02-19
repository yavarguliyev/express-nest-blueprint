import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SpacingSliderHelperService } from './spacing-slider-helper.service';
import { ParsedValue, SpacingChangeEvent } from '../../../../core/interfaces/theme.interface';

@Component({
  selector: 'app-spacing-slider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './spacing-slider.html',
  styleUrl: './spacing-slider.css'
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
      value: value
    });
  }
}
