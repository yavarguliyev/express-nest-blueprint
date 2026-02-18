import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DraftStatusConfig } from '../../../core/interfaces/theme.interface';

@Component({
  selector: 'app-draft-status-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (config().hasDrafts) {
      <div class="draft-status-bar">
        <div class="status-info">
          <div class="draft-indicator">
            <span class="material-icons draft-icon">edit</span>
            <span class="draft-count">{{ config().draftCount }}</span>
            <span class="draft-label">unsaved changes</span>
          </div>
          @if (config().affectedItems && config().affectedItems!.length > 0) {
            <div class="affected-info">
              <span class="affected-text">across</span>
              <span class="item-count">{{ config().affectedItems!.length }}</span>
              <span class="item-label">{{ getItemLabel() }}</span>
            </div>
          }
        </div>

        <div class="draft-actions">
          <button
            class="btn-secondary reset-btn"
            (click)="onResetChanges()"
            [disabled]="config().isProcessing"
            [title]="'Discard all unsaved changes'"
          >
            <span class="material-icons">{{ config().resetButtonIcon || 'refresh' }}</span>
            {{ config().resetButtonText || 'Reset All' }}
          </button>
          <button class="btn-primary save-btn" (click)="onSaveChanges()" [disabled]="config().isProcessing" [title]="'Save all changes'">
            @if (!config().isProcessing) {
              <span>
                <span class="material-icons">{{ config().saveButtonIcon || 'save' }}</span>
                {{ config().saveButtonText || 'Save Changes' }}
              </span>
            } @else {
              <span class="loading-text">
                <span class="spinner"></span>
                Saving...
              </span>
            }
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './draft-status-bar.css'
})
export class DraftStatusBar {
  config = input.required<DraftStatusConfig>();

  saveChanges = output<void>();
  resetChanges = output<void>();

  onSaveChanges (): void {
    this.saveChanges.emit();
  }

  onResetChanges (): void {
    this.resetChanges.emit();
  }

  getItemLabel (): string {
    const items = this.config().affectedItems || [];
    const itemType = this.config().itemType || 'item';

    if (items.length === 1) return itemType === 'table' ? 'table' : itemType === 'token' ? 'token' : 'item';
    else return itemType === 'table' ? 'tables' : itemType === 'token' ? 'tokens' : 'items';
  }
}
