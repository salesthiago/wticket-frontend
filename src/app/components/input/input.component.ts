import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, input, InputSignal, Output, signal } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { FormErrorMessages } from '../validators';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber'
// import { NgxMaskDirective } from 'ngx-mask';
import { InputType, InputIconSideType } from '../interface/InputType';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    InputIconModule,
    IconFieldModule,
    // NgxMaskDirective,
    DatePickerModule,
    InputNumberModule
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss'
})

export class InputComponent<T> implements ControlValueAccessor {

  public inputLabel = input<T>();
  public value = input<T>();
  public inputMask = input<string>();
  public inputType: InputSignal<InputType> = input.required<InputType>();
  public inputPlaceholder = input<string>('');
  public inputIcon = input<string>();
  public inputIconSide = input<InputIconSideType>('left');
  public inputName = input<string>(''); // Novo input para name
  public ngModelOptions = input<any>({}); // Novo input para opções do ngModel
  public inputValue!: T;
  public formControl = input<AbstractControl | null>(null);
  public bgColor = input<string>('white');
  public borderColor = input<string>('var(--p-gray-300)');
  private errorMessages: any = FormErrorMessages;
  public isDisabledInput = input<boolean>(false);
  protected isDisabled = signal<boolean>(false);
  public isFull = input<boolean>(false);
  protected onTouched?: () => T;
  protected onChanged?: (value: T) => T;

  private ngControl = inject(NgControl, { optional: true });
  @Output() iconClick = new EventEmitter<void>();

  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
    effect(() => {
      this.isDisabled.set(this.isDisabledInput());
    });
  }

  public writeValue(obj: T): void {
    this.inputValue = obj;
  }

  public registerOnChange(fn: (value: T) => T): void {
    this.onChanged = fn;
  }

  public registerOnTouched(fn: () => T): void {
    this.onTouched = fn;
  }

  public handleIconClick() {
    this.iconClick.emit();
  }

  public setDisabledState?(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  // Getter para as opções do ngModel
  public get modelOptions(): any {
    const options = this.ngModelOptions();
    // Se não tiver name definido e não for standalone, força standalone
    if (!this.inputName() && !options.standalone) {
      return { ...options, standalone: true };
    }
    return options;
  }

  public get control(): AbstractControl | null {
    return this.formControl() || (this.ngControl ? this.ngControl.control : null);
  }

  public get invalid(): boolean {
    const control = this.control;
    return !!control && control.invalid && (control.touched && control.dirty);
  }

  public get errorMessage(): string | null {
    const control = this.control;
    if (!control || !this.invalid) return null;
    const errorKey = Object.keys(control.errors!)[0];
    const errorValue = control.errors![errorKey];

    if (typeof this.errorMessages[errorKey] === 'function') {
      return this.errorMessages[errorKey](errorValue);
    }

    return this.errorMessages[errorKey] || 'Campo inválido';

  }

  public getDynamicMask(): string {
    if (this.inputMask() === 'thousand') {
      return 'separator.0';
    }
    return this.inputMask() || '';
  }
}
