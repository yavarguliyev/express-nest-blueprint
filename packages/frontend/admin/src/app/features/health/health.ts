import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { DashboardService } from '../../core/services/ui/dashboard.service';
import { DraggableResizableDirective } from '../../shared/directives/draggable-resizable.directive';
import { HealthStatus, HealthLogEntry } from '../../core/interfaces/dashboard.interface';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule, DraggableResizableDirective],
  templateUrl: './health.html',
  styleUrl: './health.css'
})
export class Health implements OnInit {
  private dashboardService = inject(DashboardService);

  healthStatus = signal<HealthStatus | null>(null);
  logs = signal<HealthLogEntry[]>([]);
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
    forkJoin({
      health: this.dashboardService.getHealth(),
      logs: this.dashboardService.getHealthLogs()
    }).subscribe({
      next: data => {
        this.healthStatus.set(data.health);
        this.logs.set(data.logs);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load system health diagnostics.');
        this.loading.set(false);
      }
    });
  }

  forceRefresh (): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      health: this.dashboardService.refreshHealth(),
      logs: this.dashboardService.getHealthLogs()
    }).subscribe({
      next: data => {
        this.healthStatus.set(data.health);
        this.logs.set(data.logs);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load system health diagnostics.');
        this.loading.set(false);
      }
    });
  }
}
