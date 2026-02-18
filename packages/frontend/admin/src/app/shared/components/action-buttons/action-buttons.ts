import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActionButtonConfig } from '../../../core/interfaces/theme.interface';

@Component({
  selector: 'app-action-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-buttons.html',
  styleUrl: './action-buttons.css'
})
export class ActionButtons {
  @Input() updateConfig: ActionButtonConfig = { show: true };
  @Input() deleteConfig: ActionButtonConfig = { show: true };
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  @Output() updateClick = new EventEmitter<void>();
  @Output() deleteClick = new EventEmitter<void>();

  onUpdate (): void {
    if (!this.updateConfig.disabled) this.updateClick.emit();
  }

  onDelete (): void {
    if (!this.deleteConfig.disabled) this.deleteClick.emit();
  }
}
