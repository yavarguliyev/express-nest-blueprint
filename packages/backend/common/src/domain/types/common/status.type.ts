export type BaseStatus = 'up' | 'down';

export type ChartType = 'line' | 'bar' | 'pie' | 'gauge';

export type DashboardAlertType = 'info' | 'warning' | 'error';

export type ExtendedStatus = BaseStatus | 'degraded';

export type HealthComponentName = 'compute workers' | 'database' | 'kafka' | 'queues' | 'redis' | 'storage';

export type HealthStatus = ExtendedStatus;

export type OverallStatus = BaseStatus;

export type OperationStatus = 'completed' | 'failed' | 'pending' | 'processing';

export type ReadyStatus = BaseStatus;

export type ReadyComponentName = 'database' | 'redis' | 'kafka';

export type TableAction = 'create' | 'delete' | 'update';

export type WorkerStatus = 'not_initialized' | 'running' | 'stopped';
