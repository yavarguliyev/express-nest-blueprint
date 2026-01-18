import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DashboardService,
  DashboardResponse,
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

  data = signal<DashboardResponse | null>(null);
  health = signal<HealthStatus | null>(null);
  loading = signal(true);
  error = signal('');

  // Make Math available in template
  Math = Math;

  ngOnInit () {
    void this.refreshData();
  }

  getMetricValue (name: string): number {
    const metric = this.data()?.metrics.find((m) => m.name === name);
    return metric ? metric.value : 0;
  }

  refreshData () {
    this.loading.set(true);
    this.error.set('');

    this.dashboardService.getMetrics().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load metrics');
        this.loading.set(false);
      },
    });

    this.dashboardService.getHealth().subscribe({
      next: (data) => this.health.set(data),
      error: () => this.error.set('Failed to load health status'),
    });
  }
}
