import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { BARCODE_PATTERNS, VALIDATION_RULES } from '../models/tote.models';

export class BarcodeValidators {
  static pattern(pattern: RegExp = BARCODE_PATTERNS.ALPHANUMERIC): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.trim();
      if (!pattern.test(value)) {
        return {
          pattern: {
            requiredPattern: pattern.source,
            actualValue: value
          }
        };
      }

      return null;
    };
  }

  static minLength(length: number = VALIDATION_RULES.MIN_LENGTH): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.trim();
      if (value.length < length) {
        return {
          minlength: {
            requiredLength: length,
            actualLength: value.length
          }
        };
      }

      return null;
    };
  }

  static maxLength(length: number = VALIDATION_RULES.MAX_LENGTH): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.trim();
      if (value.length > length) {
        return {
          maxlength: {
            requiredLength: length,
            actualLength: value.length
          }
        };
      }

      return null;
    };
  }

  static noWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const hasWhitespace = /\s/.test(control.value);
      return hasWhitespace ? { whitespace: true } : null;
    };
  }

  static noSpecialChars(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const hasSpecialChars = /[^a-zA-Z0-9-_]/.test(control.value);
      return hasSpecialChars ? { specialChars: true } : null;
    };
  }

  static toteIdFormat(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.trim();
      if (!BARCODE_PATTERNS.TOTE_ID.test(value)) {
        return {
          toteIdFormat: {
            expectedFormat: 'prefix-type-number (e.g., demo-tote-1)',
            actualValue: value
          }
        };
      }

      return null;
    };
  }

  static asyncBarcodeExists(checkFn: (value: string) => Observable<boolean>): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return timer(500).pipe(
        switchMap(() => checkFn(control.value)),
        map(exists => exists ? null : { barcodeNotExists: true }),
        catchError(() => of(null))
      );
    };
  }

  static blacklistedBarcodes(blacklist: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.trim().toLowerCase();
      const isBlacklisted = blacklist.some(item => item.toLowerCase() === value);

      return isBlacklisted ? { blacklisted: true } : null;
    };
  }

  static sanitizeInput(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i
      ];

      const hasDangerousContent = dangerousPatterns.some(pattern =>
        pattern.test(control.value)
      );

      return hasDangerousContent ? { dangerous: true } : null;
    };
  }
}

export function getValidationErrorMessage(errors: ValidationErrors): string {
  if (errors['required']) {
    return 'Barcode is required';
  }
  if (errors['minlength']) {
    const { requiredLength, actualLength } = errors['minlength'];
    return `Barcode must be at least ${requiredLength} characters (current: ${actualLength})`;
  }
  if (errors['maxlength']) {
    const { requiredLength, actualLength } = errors['maxlength'];
    return `Barcode cannot exceed ${requiredLength} characters (current: ${actualLength})`;
  }
  if (errors['pattern']) {
    return 'Barcode can only contain letters, numbers, hyphens, and underscores';
  }
  if (errors['whitespace']) {
    return 'Barcode cannot contain spaces';
  }
  if (errors['specialChars']) {
    return 'Barcode contains invalid special characters';
  }
  if (errors['toteIdFormat']) {
    return 'Invalid tote ID format. Expected: prefix-type-number (e.g., demo-tote-1)';
  }
  if (errors['barcodeNotExists']) {
    return 'This barcode does not exist in the system';
  }
  if (errors['blacklisted']) {
    return 'This barcode is not allowed';
  }
  if (errors['dangerous']) {
    return 'Invalid input detected';
  }

  return 'Invalid barcode';
}
