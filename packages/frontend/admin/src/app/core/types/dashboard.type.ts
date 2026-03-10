export type MetricTrend = 'up' | 'down' | 'stable';

export type MetricType = 'line' | 'bar' | 'pie' | 'gauge';

export type SeverityType = 'info' | 'warning' | 'error';

export type MetricStatus = 'healthy' | 'degraded' | 'down';

export type ServiceHealthStatus = MetricStatus | 'up' | 'down';

export type HealthLogLevel = 'info' | 'success' | 'warn' | 'error';
