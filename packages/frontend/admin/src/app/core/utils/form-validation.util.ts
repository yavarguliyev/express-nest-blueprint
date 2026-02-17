import { FormValidationUtil as CommonFormValidationUtil } from '@app/common';

import {
  FieldChange,
  ValidationResults,
  FieldValidationRule,
} from '../interfaces/field-config.interface';

export class FormValidationUtil {
  static hasChanges (current: Record<string, unknown>, original: Record<string, unknown>): boolean {
    return CommonFormValidationUtil.hasChanges(current, original);
  }

  static getChangedFields (
    current: Record<string, unknown>,
    original: Record<string, unknown>,
  ): FieldChange[] {
    return CommonFormValidationUtil.getChangedFields(current, original);
  }

  static getChangedData (
    current: Record<string, unknown>,
    original: Record<string, unknown>,
  ): Record<string, unknown> {
    return CommonFormValidationUtil.getChangedData(current, original);
  }

  static isFieldChanged (
    fieldName: string,
    current: Record<string, unknown>,
    original: Record<string, unknown>,
  ): boolean {
    return CommonFormValidationUtil.isFieldChanged(fieldName, current, original);
  }

  static validateEmail (email: unknown): ValidationResults {
    return CommonFormValidationUtil.validateEmail(email);
  }

  static validatePassword (password: string, minLength = 8): ValidationResults {
    return CommonFormValidationUtil.validatePassword(password, minLength);
  }

  static validateRequiredFields (
    data: Record<string, unknown>,
    rules: FieldValidationRule[],
  ): ValidationResults {
    return CommonFormValidationUtil.validateRequiredFields(data, rules);
  }

  static generateRandomPassword (length = 12): string {
    return CommonFormValidationUtil.generateRandomPassword(length);
  }

  static validateRole (role: unknown): ValidationResults {
    if (!role || role === '') return { valid: false, error: 'Role is required' };

    const validRoles = ['global admin', 'admin', 'moderator', 'user'];
    if (typeof role === 'string' && !validRoles.includes(role.toLowerCase())) {
      return { valid: false, error: 'Invalid role selected' };
    }

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
}
