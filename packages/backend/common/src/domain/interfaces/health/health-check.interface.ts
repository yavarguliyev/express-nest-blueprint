import { BaseHealthComponent, Timestamped } from '../common/base.interface';
import { HealthComponentName, HealthStatus, OverallStatus, ReadyComponentName, ReadyStatus, WorkerStatus } from '../../types/common/status.type';
import { DatabaseStatus } from '../../types/health/health-status.type';

export interface RedisStatus extends BaseHealthComponent {
  info?: {
    status: string;
  };
}

export interface QueueStatus extends BaseHealthComponent {
  items?: unknown[];
}

export interface ComputeStatus extends BaseHealthComponent {
  workerEnabled?: boolean;
  workerStatus?: WorkerStatus;
  pendingJobsCount?: number;
  handlersCount?: number;
}

export interface HealthCheckResult extends Timestamped {
  status: HealthStatus;
  components: Partial<Record<HealthComponentName, BaseHealthComponent>>;
}

export interface LiveCheckResult extends Timestamped {
  status: ReadyStatus;
}

export interface ReadyCheckResult extends Timestamped {
  status: HealthStatus;
  components: Pick<HealthCheckResult['components'], ReadyComponentName>;
}

export interface HealthComponentStatus {
  name: HealthComponentName;
  status: HealthStatus;
  message?: string;
  details?: DatabaseStatus | RedisStatus | QueueStatus | ComputeStatus;
}

export interface HealthCheckStatus {
  overallStatus: OverallStatus;
  timestamp: string;
  components: HealthComponentStatus[];
}
