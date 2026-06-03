import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class SecurityValidators {
  /**
   * Blocks any input containing HTML tags or <script> tags to prevent XSS.
   */
  static noHtml(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value || typeof value !== 'string') {
        return null;
      }

      // Regex to detect HTML tags: < followed by anything and ending with >
      const hasHtml = /<[^>]*>/g.test(value);
      // Explicitly check for script tags just in case
      const hasScript = /<script\b[^>]*>([\s\S]*?)<\/script>/gim.test(value);

      if (hasHtml || hasScript) {
        return { hasHtml: true };
      }

      return null;
    };
  }

  /**
   * Validator for phone numbers (exactly 10 digits).
   */
  static phone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      
      const isValid = /^\d{10}$/.test(value.toString());
      return isValid ? null : { invalidPhone: true };
    };
  }

  /**
   * Blocks any input containing digits. Useful for name fields.
   */
  static noNumbers(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value || typeof value !== 'string') return null;
      
      const hasNumbers = /\d/.test(value);
      return hasNumbers ? { hasNumbers: true } : null;
    };
  }

  /**
   * Blocks any input containing non-digit characters.
   */
  static onlyNumbers(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      
      const isOnlyNumbers = /^\d+$/.test(value.toString());
      return isOnlyNumbers ? null : { onlyNumbers: true };
    };
  }
}
