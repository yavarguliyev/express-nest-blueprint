import {
  HealthStatus,
  WorkerStatus,
  HealthComponentName,
  ReadyStatus,
  ReadyComponentName,
  OverallStatus,
  DashboardAlertType,
  ChartType
} from '../../types/common/status.type';
import { BaseHealthComponent, Timestamped } from '../common/base.interface';

export interface WithStatus<S = HealthStatus> {
  status: S;
}

export interface WithMessage {
  message?: string;
}

export interface WithDetails<D = BaseHealthComponent> {
  details?: D;
}

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

export interface HealthComponentStatus
  extends WithStatus<HealthStatus>, WithMessage, WithDetails<BaseHealthComponent | RedisStatus | QueueStatus | ComputeStatus> {
  name: HealthComponentName;
}

export interface HealthCheckStatus {
  overallStatus: OverallStatus;
  timestamp: string;
  components: HealthComponentStatus[];
}

export interface HealthRegistryItem {
  key: string;
  name: string;
  unit?: string;
  critical?: boolean;
  threshold?: number | null;
  promMetric?: string;
  precision?: number;
}

export interface AlertTemplate {
  header: string;
  title: (name: string) => string;
  message: (name: string, value: number, unit: string, precision?: number) => string;
  type: DashboardAlertType;
}

export interface DashboardChartConfig {
  title: string;
  metric: string;
  type: ChartType;
}
