import { AbstractControl, FormGroup } from '@angular/forms';

export class FormUtil {
  static getChangedFields (form: FormGroup): Record<string, unknown> {
    const changes: Record<string, unknown> = {};
    
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control && control.dirty) {
        changes[key] = control.value;
      }
    });
    
    return changes;
  }

  static hasChanges (form: FormGroup): boolean {
    return form.dirty;
  }

  static markAllAsTouched (form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();
    });
  }

  static resetForm (form: FormGroup, value?: unknown): void {
    form.reset(value);
  }

  static getAllErrors (form: FormGroup): Record<string, unknown> {
    const errors: Record<string, unknown> = {};
    
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    
    return errors;
  }

  static getErrorMessages (control: AbstractControl): string[] {
    if (!control.errors) return [];
    
    const messages: string[] = [];
    const errors = control.errors;
    
    if (errors['required']) messages.push('This field is required');
    if (errors['email']) messages.push('Please enter a valid email address');
    if (errors['phone']) messages.push('Please enter a valid phone number');
    if (errors['url']) messages.push('Please enter a valid URL');
    if (errors['strongPassword']) messages.push('Password must meet strength requirements');
    if (errors['minlength']) {
      const minlengthError = errors['minlength'] as { requiredLength: number };
      messages.push(`Minimum length is ${minlengthError.requiredLength}`);
    }
    if (errors['maxlength']) {
      const maxlengthError = errors['maxlength'] as { requiredLength: number };
      messages.push(`Maximum length is ${maxlengthError.requiredLength}`);
    }
    if (errors['min']) {
      const minError = errors['min'] as { min: number };
      messages.push(`Minimum value is ${minError.min}`);
    }
    if (errors['max']) {
      const maxError = errors['max'] as { max: number };
      messages.push(`Maximum value is ${maxError.max}`);
    }
    if (errors['pattern']) messages.push('Invalid format');
    if (errors['match']) messages.push('Fields do not match');
    
    return messages;
  }

  static hasError (control: AbstractControl, errorName: string): boolean {
    return control.hasError(errorName) && control.touched;
  }

  static disableAll (form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.disable();
    });
  }

  static enableAll (form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.enable();
    });
  }
}
