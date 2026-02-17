export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^\d+$/,
  ALPHA: /^[a-zA-Z]+$/
} as const;

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?'
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  PHONE: 'Please enter a valid phone number',
  URL: 'Please enter a valid URL',
  MIN_LENGTH: (min: number) => `Minimum length is ${min} characters`,
  MAX_LENGTH: (max: number) => `Maximum length is ${max} characters`,
  PATTERN: 'Invalid format',
  STRONG_PASSWORD: 'Password must contain uppercase, lowercase, number, and special character'
} as const;
