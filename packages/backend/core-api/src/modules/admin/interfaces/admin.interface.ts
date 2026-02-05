import { ChartType, DashboardAlertType, TableAction } from '@config/libs';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartData {
  title: string;
  type: ChartType;
  data: ChartDataPoint[];
  metadata?: Record<string, unknown>;
}

export interface DashboardAlert {
  header: string;
  title: string;
  message: string;
  type: DashboardAlertType;
  timestamp: string;
}

export interface ColumnMetadata {
  name: string;
  type: string;
  required: boolean;
  editable: boolean;
}

export interface DashboardMetric {
  name: string;
  value: number;
  unit?: string;
  timestamp: string;
}

export interface DashboardMetricsResponse {
  metrics: DashboardMetric[];
  charts: ChartData[];
  alerts: DashboardAlert[];
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
      supportedOperations: TableAction[];
    };
  };
}
