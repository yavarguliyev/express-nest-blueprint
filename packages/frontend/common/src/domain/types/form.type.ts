import { ValidationErrors, ValidatorFn } from '@angular/forms';

export interface FormState<T> {
  value: T;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  errors: ValidationErrors | null;
}

export interface FieldState {
  value: unknown;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  errors: string[];
}

export enum FieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PASSWORD = 'password',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  TEXTAREA = 'textarea'
}

export interface SelectOption<T = unknown> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface FieldConfig {
  name: string;
  type: FieldType;
  label: string;
  validators?: ValidatorFn[];
  defaultValue?: unknown;
  options?: SelectOption[];
  placeholder?: string;
  helpText?: string;
}
