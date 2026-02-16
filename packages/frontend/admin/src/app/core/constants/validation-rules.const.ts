export const VALIDATION_RULES = {
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
} as const;

export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`,
  PASSWORD_MISMATCH: 'Passwords do not match',
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_MIN_LENGTH: `Username must be at least ${VALIDATION_RULES.USERNAME_MIN_LENGTH} characters`,
  ROLE_REQUIRED: 'Role is required',
  FIELD_REQUIRED: 'This field is required',
} as const;
