import { Directive, HostListener, ElementRef, Renderer2, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[appInputTrim]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputTrimDirective),
      multi: true
    }
  ]
})
export class InputTrimDirective implements ControlValueAccessor {
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    this.onChange(value);
  }

  @HostListener('blur')
  onBlur(): void {
    const value = this.elementRef.nativeElement.value;
    const trimmed = value.trim();

    if (value !== trimmed) {
      this.renderer.setProperty(this.elementRef.nativeElement, 'value', trimmed);
      this.onChange(trimmed);
    }

    this.onTouched();
  }

  writeValue(value: any): void {
    const normalizedValue = value == null ? '' : value;
    this.renderer.setProperty(this.elementRef.nativeElement, 'value', normalizedValue);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', isDisabled);
  }
}
