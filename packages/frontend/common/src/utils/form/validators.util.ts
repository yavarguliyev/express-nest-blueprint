import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { ValidationUtil } from '../validation/validation.util';

export class CustomValidators {
  static email (control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value = String(control.value);
    return ValidationUtil.isEmail(value) ? null : { email: true };
  }

  static phone (control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value = String(control.value);
    return ValidationUtil.isPhone(value) ? null : { phone: true };
  }

  static url (control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value = String(control.value);
    return ValidationUtil.isUrl(value) ? null : { url: true };
  }

  static strongPassword (control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value = String(control.value);
    return ValidationUtil.isStrongPassword(value) ? null : { strongPassword: true };
  }

  static match (controlName: string, matchingControlName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formGroup = control.parent;
      if (!formGroup) return null;

      const targetControl = formGroup.get(controlName);
      const matchingControl = formGroup.get(matchingControlName);

      if (!targetControl || !matchingControl) return null;
      if (targetControl.value !== matchingControl.value) return { match: true };

      return null;
    };
  }

  static minDate (minDate: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const controlDate = new Date(control.value as string | number | Date);
      return controlDate >= minDate ? null : { minDate: { min: minDate, actual: controlDate } };
    };
  }

  static maxDate (maxDate: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const controlDate = new Date(control.value as string | number | Date);
      return controlDate <= maxDate ? null : { maxDate: { max: maxDate, actual: controlDate } };
    };
  }

  static numeric (control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    return ValidationUtil.isNumeric(String(control.value)) ? null : { numeric: true };
  }

  static alphanumeric (control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value = String(control.value);
    return ValidationUtil.isAlphanumeric(value) ? null : { alphanumeric: true };
  }
}
