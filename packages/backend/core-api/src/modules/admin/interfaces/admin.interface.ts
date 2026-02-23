import {
  ChartType,
  DashboardAlertType,
  TableAction,
  PromMetric,
  HealthCheckResult,
  ConflictItem,
  JwtPayload,
  RepositoryEntry,
  WithCategory,
  WithName
} from '@config/libs';

export interface ConflictDetectionResult {
  conflicts: ConflictItem[];
}

export interface DashboardMetricsContext {
  rawMetrics: PromMetric[];
  healthResult: HealthCheckResult;
  kafkaMetrics: { messagesInPerSec: number; underReplicatedPartitions: number };
  dbQueryResults: { rows: { size: string }[] };
  getVal: <T>(idx: number, fallback: T) => T;
}

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

export interface ChartConfig {
  metric: string;
  title: string;
  type: string;
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

export interface TableMetadata extends WithCategory, WithName {
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

export interface TableOperationBase extends WithCategory, WithName {
  currentUser?: JwtPayload;
  bypassQueue?: boolean;
}

export interface CreateTableOperation extends TableOperationBase {
  data: unknown;
}

export interface UpdateTableOperation extends TableOperationBase {
  id: string | number;
  data: Record<string, unknown>;
}

export interface DeleteTableOperation extends TableOperationBase {
  id: string | number;
}

export interface WithPagination {
  pageNum: string | undefined;
  limitNum: string | undefined;
}

export interface WithSearch {
  search: string | undefined;
}

export interface WithtRepositoryEntry {
  entry?: RepositoryEntry;
}

export interface TableDataByNameParams extends WithName, WithPagination, WithSearch {}

export interface TableDataParams extends WithName, WithCategory, WithPagination, WithSearch, WithtRepositoryEntry {
  t?: string;
}

export interface TableDataByNameOperationParams extends TableDataByNameParams, WithtRepositoryEntry {}

export interface TableRecordParams extends WithName, WithCategory, WithtRepositoryEntry {
  id: string | number;
}
