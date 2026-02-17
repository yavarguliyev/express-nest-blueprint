import { charset } from '../constants';
import {
  FieldChange,
  ValidationResults,
  FieldValidationRule,
} from '../interfaces/field-config.interface';

export class FormValidationUtil {
  static hasChanges (current: Record<string, unknown>, original: Record<string, unknown>): boolean {
    for (const key in current) {
      const currentValue = current[key];
      const originalValue = original[key];

      const isEmptyCurrent =
        currentValue === null || currentValue === undefined || currentValue === '';
      const isEmptyOriginal =
        originalValue === null || originalValue === undefined || originalValue === '';

      if (isEmptyCurrent && isEmptyOriginal) continue;
      if (currentValue != originalValue) return true;
    }

    for (const key in original) {
      if (!(key in current)) return true;
    }

    return false;
  }

  static getChangedFields (
    current: Record<string, unknown>,
    original: Record<string, unknown>,
  ): FieldChange[] {
    const changes: FieldChange[] = [];

    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key) && current[key] !== original[key]) {
        changes.push({
          name: key,
          oldValue: original[key],
          newValue: current[key],
        });
      }
    }

    return changes;
  }

  static getChangedData (
    current: Record<string, unknown>,
    original: Record<string, unknown>,
  ): Record<string, unknown> {
    const changedData: Record<string, unknown> = {};

    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key) && current[key] !== original[key]) {
        changedData[key] = current[key];
      }
    }

    return changedData;
  }

  static isFieldChanged (
    fieldName: string,
    current: Record<string, unknown>,
    original: Record<string, unknown>,
  ): boolean {
    return current[fieldName] !== original[fieldName];
  }

  static validateEmail (email: unknown): ValidationResults {
    if (!email || email === '') return { valid: false, error: 'Email is required' };
    if (typeof email !== 'string') return { valid: false, error: 'Email must be a string' };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { valid: false, error: 'Invalid email format' };

    return { valid: true };
  }

  static validatePassword (password: string, minLength = 8): ValidationResults {
    if (!password || password.length === 0) return { valid: false, error: 'Password is required' };

    if (password.length < minLength) {
      return { valid: false, error: `Password must be at least ${minLength} characters long` };
    }

    return { valid: true };
  }

  static validateRole (role: unknown): ValidationResults {
    if (!role || role === '') return { valid: false, error: 'Role is required' };

    const validRoles = ['global admin', 'admin', 'moderator', 'user'];
    if (typeof role === 'string' && !validRoles.includes(role.toLowerCase())) {
      return { valid: false, error: 'Invalid role selected' };
    }

    return { valid: true };
  }

  static validateRequiredFields (
    data: Record<string, unknown>,
    rules: FieldValidationRule[],
  ): ValidationResults {
    const errors: string[] = [];

    for (const rule of rules) {
      if (rule.required) {
        const value = data[rule.name];
        if (value === null || value === undefined || value === '') {
          errors.push(`${rule.name} is required`);
        }
      }
    }

    if (errors.length > 0) return { valid: false, errors };

    return { valid: true };
  }

  static hasRole (data: Record<string, unknown>): boolean {
    return Object.prototype.hasOwnProperty.call(data, 'role');
  }

  static isRoleValid (data: Record<string, unknown>): boolean {
    if (!this.hasRole(data)) return true;
    const role = data['role'];
    return role !== null && role !== undefined && role !== '';
  }

  static hasPassword (data: Record<string, unknown>): boolean {
    return Object.prototype.hasOwnProperty.call(data, 'password');
  }

  static isPasswordValid (data: Record<string, unknown>, minLength = 8): boolean {
    if (!this.hasPassword(data)) return true;
    const password = data['password'];
    if (typeof password !== 'string') return false;
    return password.length >= minLength;
  }

  static generateRandomPassword (length = 12): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return result;
  }
}
