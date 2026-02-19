import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoadingService } from '../../../core/services/ui/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay" *ngIf="loadingService.state$ | async as state" [style.display]="state.isLoading ? 'flex' : 'none'">
      <div class="spinner-container">
        <div class="spinner"></div>
        <p class="loading-text">{{ state.message }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--modal-overlay-bg, rgba(0, 0, 0, 0.4));
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        animation: fadeIn 0.3s ease-out;
      }

      .spinner-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
      }

      .spinner {
        width: 60px;
        height: 60px;
        border: 4px solid var(--border-light);
        border-left-color: var(--info);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        box-shadow: 0 0 20px var(--primary-glow);
      }

      .loading-text {
        color: var(--toast-text-color);
        font-family: 'Inter', sans-serif;
        font-size: 1.1rem;
        font-weight: 500;
        letter-spacing: 0.5px;
        text-shadow: 0 2px 4px var(--shadow-darker);
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `
  ]
})
export class LoadingComponent {
  constructor(public readonly loadingService: LoadingService) {}
}
