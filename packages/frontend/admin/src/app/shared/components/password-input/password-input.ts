import { Component, Input, Output, EventEmitter, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './password-input.html',
  styleUrl: './password-input.css',
  encapsulation: ViewEncapsulation.None
})
export class PasswordInput {
  @Input() value: string = '';
  @Input() placeholder: string = 'Enter password';
  @Input() id: string = 'password-' + Math.random().toString(36).substring(2, 9);
  @Input() name: string = 'password';
  @Input() customClass: string = '';
  @Input() disabled: boolean = false;
  @Input() showGenerate: boolean = false;
  @Input() generateTitle: string = 'Synthesize high-entropy password';

  @Output() valueChange = new EventEmitter<string>();
  @Output() generate = new EventEmitter<void>();

  showPassword = signal(false);

  toggleVisibility (): void {
    this.showPassword.update(v => !v);
  }

  onInput (val: string): void {
    this.value = val;
    this.valueChange.emit(this.value);
  }

  onGenerate (): void {
    this.generate.emit();
    this.showPassword.set(true);
  }
}
