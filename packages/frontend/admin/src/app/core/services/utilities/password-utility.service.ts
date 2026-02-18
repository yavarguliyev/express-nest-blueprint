import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PasswordUtilityService {
  private readonly DEFAULT_LENGTH = 12;
  private readonly CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';

  generatePassword (length: number = this.DEFAULT_LENGTH): string {
    let password = '';

    for (let i = 0; i < length; i++) {
      password += this.CHARSET.charAt(Math.floor(Math.random() * this.CHARSET.length));
    }

    return password;
  }

  validatePasswordStrength (password: string): {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    errors: string[];
  } {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+]/.test(password);

    const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    if (criteriaCount < 2) {
      strength = 'weak';
      errors.push('Password should include uppercase, lowercase, numbers, and special characters');
    } else if (criteriaCount === 2 || criteriaCount === 3) {
      strength = 'medium';
    } else {
      strength = 'strong';
    }

    return {
      isValid: errors.length === 0,
      strength,
      errors
    };
  }
}
