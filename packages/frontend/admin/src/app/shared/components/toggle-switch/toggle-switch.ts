import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle-switch.html',
  styleUrl: './toggle-switch.css',
})
export class ToggleSwitch {
  @Input() label: string = '';
  @Input() 
  set checked (value: boolean) {
    this.checkedSignal.set(value);
  }
  get checked (): boolean {
    return this.checkedSignal();
  }
  
  @Input() disabled: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  @Output() toggle = new EventEmitter<boolean>();

  checkedSignal = signal<boolean>(false);
  toggleId = `toggle-${Math.random().toString(36).substr(2, 9)}`;

  onToggle (): void {
    if (!this.disabled) {
      this.toggle.emit(!this.checkedSignal());
    }
  }
}
