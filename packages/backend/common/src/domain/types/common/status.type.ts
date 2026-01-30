export type BaseStatus = 'up' | 'down';

export type ExtendedStatus = BaseStatus | 'degraded';

export type HealthStatus = ExtendedStatus;

export type ReadyStatus = BaseStatus;

export type OverallStatus = BaseStatus;

export type OperationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type WorkerStatus = 'running' | 'stopped' | 'not_initialized';

export type HealthComponentName = 'database' | 'redis' | 'queues' | 'compute' | 'kafka' | 'storage';
