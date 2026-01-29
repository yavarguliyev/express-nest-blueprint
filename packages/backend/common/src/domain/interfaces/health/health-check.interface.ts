import { BaseHealthComponent, Timestamped } from '../common/base.interface';
import { WorkerStatus } from '../../types/common/status.type';

export type DatabaseStatus = BaseHealthComponent;

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
  status: BaseHealthComponent['status'];
  components: {
    database?: DatabaseStatus;
    redis?: RedisStatus;
    queues?: QueueStatus;
    compute?: ComputeStatus;
  };
}

export interface LiveCheckResult extends Timestamped {
  status: 'up';
}

export interface ReadyCheckResult extends Timestamped {
  status: BaseHealthComponent['status'];
  components: {
    database: DatabaseStatus;
    redis: RedisStatus;
  };
}
