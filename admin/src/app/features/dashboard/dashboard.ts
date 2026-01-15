import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DashboardService,
  DashboardMetrics,
  HealthStatus,
} from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);

  metrics = signal<DashboardMetrics | null>(null);
  health = signal<HealthStatus | null>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit () {
    void this.refreshData();
  }

  refreshData () {
    this.loading.set(true);
    this.error.set('');

    try {
      this.dashboardService.getMetrics().subscribe({
        next: (data) => this.metrics.set(data),
        error: () => this.error.set('Failed to load metrics'),
      });

      this.dashboardService.getHealth().subscribe({
        next: (data) => this.health.set(data),
        error: () => this.error.set('Failed to load health status'),
      });
    } finally {
      this.loading.set(false);
    }
  }
}
