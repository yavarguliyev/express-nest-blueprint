import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardService } from '../../core/services/dashboard.service';
import { DraggableResizableDirective } from '../../shared/directives/draggable-resizable.directive';
import { DashboardResponse, HealthStatus, DashboardMetric, MetricConfig } from '../../core/interfaces/dashboard.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DraggableResizableDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);

  data = signal<DashboardResponse | null>(null);
  health = signal<HealthStatus | null>(null);
  loading = signal(true);
  error = signal('');

  private readonly metricConfigs: Record<string, MetricConfig> = {
    'Total Users': { icon: 'people', iconClass: 'users-icon', format: '1.0-0' },
    'Memory Usage': { icon: 'memory', iconClass: 'memory-icon', format: '1.0-2' },
    'Total HTTP Requests': { icon: 'api', iconClass: 'requests-icon', format: '1.0-0' },
    'CPU Usage': { icon: 'developer_board', iconClass: 'cpu-icon', format: '1.1-1' },
    'Database Usage': {
      icon: 'storage',
      iconClass: 'users-icon',
      iconStyle: 'background: rgba(var(--primary-rgb), 0.1); color: var(--primary-color)',
      format: '1.0-2'
    },
    'Redis Usage': {
      icon: 'cached',
      iconClass: 'requests-icon',
      iconStyle: 'background: rgba(239, 68, 68, 0.1); color: #ef4444',
      format: '1.0-2'
    },
    'Kafka Usage': {
      icon: 'hub',
      iconClass: 'memory-icon',
      iconStyle: 'background: rgba(16, 185, 129, 0.1); color: #10b981',
      format: '1.0-2'
    },
    'Kafka Under Replication Usage': {
      icon: 'sync_problem',
      iconClass: 'requests-icon',
      iconStyle: 'background: rgba(239, 68, 68, 0.1); color: #ef4444',
      format: '1.0-0'
    },
    'S3 Bucket Usage': {
      icon: 'cloud_queue',
      iconClass: 'cpu-icon',
      iconStyle: 'background: rgba(245, 158, 11, 0.1); color: #f59e0b',
      format: '1.0-2'
    }
  };

  ngOnInit (): void {
    if (!window.location.pathname.includes('/dashboard')) return;

    this.refreshData();
  }

  getDisplayMetrics (): DashboardMetric[] {
    return this.data()?.metrics || [];
  }

  getMetricIcon (name: string): string {
    return this.metricConfigs[name]?.icon || 'info';
  }

  getMetricIconClass (name: string): string {
    return this.metricConfigs[name]?.iconClass || 'users-icon';
  }

  getMetricIconStyle (name: string): string {
    return this.metricConfigs[name]?.iconStyle || '';
  }

  getMetricFormat (name: string): string {
    return this.metricConfigs[name]?.format || '1.0-0';
  }

  getMetricTrendClass (name: string, value: number): string {
    if (name === 'CPU Usage' && value > 80) return 'warning';
    if (name === 'Memory Usage' && value > 500) return 'warning';
    if (name === 'Kafka Under Replication Usage' && value > 0) return 'negative';
    return 'positive';
  }

  getMetricTrendIcon (name: string): string {
    if (name === 'Total Users') return 'trending_up';
    if (name === 'Total HTTP Requests') return '';
    if (name === 'Database Usage' || name === 'Redis Usage' || name === 'Storage Usage') return 'check_circle';
    return '';
  }

  getMetricTrendText (name: string, value: number): string {
    if (name === 'Total Users') return '+12% vs last month';
    if (name === 'Memory Usage') return `${((value / 1024) * 100).toFixed(1)}% of 1GB`;
    if (name === 'Total HTTP Requests') return `${Math.floor(value / 60)}/min`;
    if (name === 'CPU Usage') return value > 80 ? 'High load' : 'Optimal';
    if (name === 'Database Usage' || name === 'Redis Usage' || name === 'Storage Usage') return 'Optimized';
    return '';
  }

  getChartBarWidth (value: number, data: Array<{ label: string; value: number }>): number {
    const maxValue = Math.max(...data.map(d => d.value));
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  }

  getAlertIcon (type: string): string {
    const icons: Record<string, string> = {
      info: 'info',
      warning: 'warning',
      error: 'error'
    };

    return icons[type] || 'info';
  }

  refreshData (): void {
    this.loading.set(true);
    this.error.set('');

    this.dashboardService.refreshMetrics().subscribe({
      next: data => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load metrics');
        this.loading.set(false);
      }
    });

    this.dashboardService.refreshHealth().subscribe({
      next: data => this.health.set(data),
      error: () => this.error.set('Failed to load health status')
    });
  }
}
