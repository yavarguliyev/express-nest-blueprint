export interface FieldRule {
  excluded?: boolean;
  sensitive?: boolean;
  displayName?: string;
}

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
export interface FieldRule {
  excluded?: boolean;
  sensitive?: boolean;
  editable?: boolean;
  required?: boolean;
  roleField?: boolean;
  imageField?: boolean;
}
