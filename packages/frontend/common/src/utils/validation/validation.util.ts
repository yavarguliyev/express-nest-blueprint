import { VALIDATION_PATTERNS, PASSWORD_REQUIREMENTS } from '../../domain/constants/validation.const';

export class ValidationUtil {
  static isEmail (value: string): boolean {
    return VALIDATION_PATTERNS.EMAIL.test(value);
  }

  static isPhone (value: string): boolean {
    return VALIDATION_PATTERNS.PHONE.test(value);
  }

  static isUrl (value: string): boolean {
    return VALIDATION_PATTERNS.URL.test(value);
  }

  static isStrongPassword (value: string): boolean {
    if (value.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) return false;
    if (value.length > PASSWORD_REQUIREMENTS.MAX_LENGTH) return false;

    if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(value)) return false;
    if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !/[a-z]/.test(value)) return false;
    if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBER && !/\d/.test(value)) return false;
    if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL) {
      const specialChars = PASSWORD_REQUIREMENTS.SPECIAL_CHARS.split('');
      if (!specialChars.some(char => value.includes(char))) return false;
    }

    return true;
  }

  static isNumeric (value: string): boolean {
    return VALIDATION_PATTERNS.NUMERIC.test(value);
  }

  static isAlphanumeric (value: string): boolean {
    return VALIDATION_PATTERNS.ALPHANUMERIC.test(value);
  }

  static isAlpha (value: string): boolean {
    return VALIDATION_PATTERNS.ALPHA.test(value);
  }

  static minLength (value: string, min: number): boolean {
    return value.length >= min;
  }

  static maxLength (value: string, max: number): boolean {
    return value.length <= max;
  }
}
