import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardService } from '../../core/services/dashboard.service';
import { DraggableResizableDirective } from '../../shared/directives/draggable-resizable.directive';
import { HealthStatus } from '../../core/interfaces/dashboard.interface';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule, DraggableResizableDirective],
  templateUrl: './health.html',
  styleUrl: './health.css',
})
export class Health implements OnInit {
  private dashboardService = inject(DashboardService);

  healthStatus = signal<HealthStatus | null>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit (): void {
    if (window.location.pathname.includes('/health')) {
      this.refresh();
    }
  }

  refresh (): void {
    this.loading.set(true);
    this.error.set('');
    this.dashboardService.getHealth().subscribe({
      next: (data) => {
        this.healthStatus.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load system health diagnostics.');
        this.loading.set(false);
      },
    });
  }

  forceRefresh (): void {
    this.loading.set(true);
    this.error.set('');
    this.dashboardService.refreshHealth().subscribe({
      next: (data) => {
        this.healthStatus.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load system health diagnostics.');
        this.loading.set(false);
      },
    });
  }
}
