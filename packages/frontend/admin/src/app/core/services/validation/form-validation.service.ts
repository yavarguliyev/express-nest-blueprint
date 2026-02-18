import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {
  hasFormChanges (currentData: Record<string, unknown>, originalData: Record<string, unknown>): boolean {
    const allKeys = new Set([...Object.keys(currentData), ...Object.keys(originalData)]);

    for (const key of allKeys) {
      if (!this.areValuesEqual(currentData[key], originalData[key])) return true;
    }

    return false;
  }

  getChangedFields (
    currentData: Record<string, unknown>,
    originalData: Record<string, unknown>
  ): Array<{ name: string; oldValue: unknown; newValue: unknown }> {
    const changes: Array<{ name: string; oldValue: unknown; newValue: unknown }> = [];

    for (const key in currentData) {
      if (currentData[key] !== originalData[key]) {
        changes.push({
          name: key,
          oldValue: originalData[key],
          newValue: currentData[key]
        });
      }
    }

    return changes;
  }

  validateFormData (formData: Record<string, unknown>, columns: Array<{ name: string; required: boolean }>): string[] {
    const errors: string[] = [];

    for (const column of columns) {
      if (column.required && this.isEmpty(formData[column.name])) errors.push(`${column.name} is required`);
    }

    return errors;
  }

  validateRole (formData: Record<string, unknown>): boolean {
    return 'role' in formData && this.isEmpty(formData['role']);
  }

  validatePassword (password: string, minLength = 8): boolean {
    return Boolean(password && password.length >= minLength);
  }

  private isEmpty (value: unknown): boolean {
    return value === null || value === undefined || value === '';
  }

  private areValuesEqual (value1: unknown, value2: unknown): boolean {
    const isEmpty1 = this.isEmpty(value1);
    const isEmpty2 = this.isEmpty(value2);
    if (isEmpty1 && isEmpty2) return true;
    return value1 === value2;
  }
}
