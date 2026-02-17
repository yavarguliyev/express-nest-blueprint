export interface FieldChange {
  name: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface ValidationResults {
  valid: boolean;
  error?: string;
  errors?: string[];
}

export interface FieldValidationRule {
  name: string;
  required: boolean;
}
