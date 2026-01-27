import { ComputeStatus, DatabaseStatus, QueueStatus, RedisStatus } from '@config/libs';

export interface DashboardAlert {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: string;
}

export interface DashboardMetric {
  name: string;
  value: number;
  unit?: string;
  timestamp: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartData {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'gauge';
  data: ChartDataPoint[];
  metadata?: Record<string, unknown>;
}

export interface HealthComponentStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  message?: string;
  details?: DatabaseStatus | RedisStatus | QueueStatus | ComputeStatus;
}

export interface TableMetadata {
  category: string;
  name: string;
  displayName: string;
  tableName: string;
  columns: ColumnMetadata[];
  actions?: {
    create?: boolean;
    update?: boolean;
    delete?: boolean;
    bulkOperations?: {
      enabled: boolean;
      maxBatchSize: number;
      supportedOperations: ('create' | 'update' | 'delete')[];
    };
  };
}

export interface ColumnMetadata {
  name: string;
  type: string;
  required: boolean;
  editable: boolean;
}
