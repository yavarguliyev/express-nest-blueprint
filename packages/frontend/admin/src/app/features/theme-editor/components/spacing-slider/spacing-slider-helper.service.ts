import { Injectable } from '@angular/core';

import { ParsedValue } from '../../../../core/interfaces/token.interface';

@Injectable({
  providedIn: 'root',
})
export class SpacingSliderHelperService {
  parseValue (value: string): ParsedValue {
    if (!value || value === '0') return { number: 0, unit: 'px' };

    const match = value.match(/^(-?\d*\.?\d+)(.*)$/);
    if (match) {
      const number = parseFloat(match[1] || '0');
      const unit = match[2]?.trim() || 'px';
      return { number, unit };
    }

    return { number: 0, unit: 'px' };
  }

  getMinValue (unit: string): number {
    switch (unit) {
      case 'rem':
      case 'em':
        return 0;
      case '%':
        return 0;
      case 'vh':
      case 'vw':
        return 0;
      case 'px':
      default:
        return 0;
    }
  }

  getMaxValue (unit: string): number {
    switch (unit) {
      case 'rem':
      case 'em':
        return 10;
      case '%':
        return 100;
      case 'vh':
      case 'vw':
        return 100;
      case 'px':
      default:
        return 200;
    }
  }

  getStepValue (unit: string): number {
    switch (unit) {
      case 'rem':
      case 'em':
        return 0.1;
      case '%':
        return 1;
      case 'vh':
      case 'vw':
        return 1;
      case 'px':
      default:
        return 1;
    }
  }

  getValueType (value: string): string {
    const parsed = this.parseValue(value);

    if (parsed.number === 0) return 'None';
    if (parsed.unit === 'px') return 'Fixed';
    if (parsed.unit === 'rem' || parsed.unit === 'em') return 'Relative';
    if (parsed.unit === '%') return 'Percentage';
    if (parsed.unit === 'vh' || parsed.unit === 'vw') return 'Viewport';

    return 'Custom';
  }

  getAvailableUnits (): string[] {
    return ['px', 'rem', 'em', '%', 'vh', 'vw'];
  }

  formatValue (number: number, unit: string): string {
    if (number === 0) return '0';
    return `${number}${unit}`;
  }

  getPresetValues (unit: string): Array<{ label: string; value: string }> {
    switch (unit) {
      case 'rem':
        return [
          { label: 'None', value: '0' },
          { label: 'XS', value: '0.25rem' },
          { label: 'SM', value: '0.5rem' },
          { label: 'MD', value: '1rem' },
          { label: 'LG', value: '1.5rem' },
          { label: 'XL', value: '2rem' },
        ];
      case 'px':
        return [
          { label: 'None', value: '0' },
          { label: 'XS', value: '4px' },
          { label: 'SM', value: '8px' },
          { label: 'MD', value: '16px' },
          { label: 'LG', value: '24px' },
          { label: 'XL', value: '32px' },
        ];
      case '%':
        return [
          { label: 'None', value: '0' },
          { label: 'Quarter', value: '25%' },
          { label: 'Half', value: '50%' },
          { label: 'Three Quarters', value: '75%' },
          { label: 'Full', value: '100%' },
        ];
      default:
        return [
          { label: 'None', value: '0' },
          { label: 'Small', value: `2${unit}` },
          { label: 'Medium', value: `4${unit}` },
          { label: 'Large', value: `8${unit}` },
        ];
    }
  }
}
