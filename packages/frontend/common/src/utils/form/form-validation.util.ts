import { ValidationUtil } from '../validation/validation.util';
import { charset } from '../../domain/constants/random-password.const';
import { FieldChange, ValidationResults, FieldValidationRule } from '../../domain/interfaces/field-config.interface';

export class FormValidationUtil {
  static hasChanges (current: Record<string, unknown>, original: Record<string, unknown>): boolean {
    for (const key in current) {
      const currentValue = current[key];
      const originalValue = original[key];

      const isEmptyCurrent = currentValue === null || currentValue === undefined || currentValue === '';
      const isEmptyOriginal = originalValue === null || originalValue === undefined || originalValue === '';

      if (isEmptyCurrent && isEmptyOriginal) continue;
      if (currentValue != originalValue) return true;
    }

    for (const key in original) {
      if (!(key in current)) return true;
    }

    return false;
  }

  static getChangedFields (current: Record<string, unknown>, original: Record<string, unknown>): FieldChange[] {
    const changes: FieldChange[] = [];

    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key) && current[key] !== original[key]) {
        changes.push({
          name: key,
          oldValue: original[key],
          newValue: current[key]
        });
      }
    }

    return changes;
  }

  static getChangedData (current: Record<string, unknown>, original: Record<string, unknown>): Record<string, unknown> {
    const changedData: Record<string, unknown> = {};

    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key) && current[key] !== original[key]) {
        changedData[key] = current[key];
      }
    }

    return changedData;
  }

  static isFieldChanged (fieldName: string, current: Record<string, unknown>, original: Record<string, unknown>): boolean {
    return current[fieldName] !== original[fieldName];
  }

  static validateEmail (email: unknown): ValidationResults {
    if (!email || email === '') return { valid: false, error: 'Email is required' };
    if (typeof email !== 'string') return { valid: false, error: 'Email must be a string' };
    if (!ValidationUtil.isEmail(email)) return { valid: false, error: 'Invalid email format' };
    return { valid: true };
  }

  static validatePassword (password: string, minLength = 8): ValidationResults {
    if (!password || password.length === 0) return { valid: false, error: 'Password is required' };
    if (!ValidationUtil.minLength(password, minLength)) return { valid: false, error: `Password must be at least ${minLength} characters long` };
    return { valid: true };
  }

  static validateRequiredFields (data: Record<string, unknown>, rules: FieldValidationRule[]): ValidationResults {
    const errors: string[] = [];

    for (const rule of rules) {
      if (rule.required) {
        const value = data[rule.name];
        if (value === null || value === undefined || value === '') errors.push(`${rule.name} is required`);
      }
    }

    if (errors.length > 0) return { valid: false, errors };

    return { valid: true };
  }

  static generateRandomPassword (length = 12): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return result;
  }
}
