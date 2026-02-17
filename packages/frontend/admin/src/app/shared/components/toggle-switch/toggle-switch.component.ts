import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle-switch.component.html',
  styleUrl: './toggle-switch.component.css',
})
export class ToggleSwitch {
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  @Output() toggleChange = new EventEmitter<boolean>();

  @Input()
  set checked (value: boolean) {
    this.checkedSignal.set(value);
  }

  get checked (): boolean {
    return this.checkedSignal();
  }

  checkedSignal = signal<boolean>(false);
  toggleId = `toggle-${Math.random().toString(36).substr(2, 9)}`;

  onToggle (): void {
    if (!this.disabled) {
      const newValue = !this.checkedSignal();
      this.checkedSignal.set(newValue);
      this.toggleChange.emit(newValue);
    }
  }
}
