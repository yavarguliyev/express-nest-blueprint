import { HealthStatus } from '../../types/common/status.type';

export interface BaseHealthComponent {
  status: HealthStatus;
  error?: string;
}

export interface Timestamped {
  timestamp: string;
}
