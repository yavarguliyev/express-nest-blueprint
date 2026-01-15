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
  details?: Record<string, unknown>;
}

export interface TableMetadata {
  category: string;
  name: string;
  displayName: string;
  tableName: string;
  columns: ColumnMetadata[];
}

export interface ColumnMetadata {
  name: string;
  type: string;
  required: boolean;
  editable: boolean;
}
