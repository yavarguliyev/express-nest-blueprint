import { BULK_OPERATION_TYPES, CONFLICT_RESOLUTION_STRATEGIES, CONFLICT_TYPES } from '../../constants/database/database.const';
import {
  PaginationResult,
  SupportsCreate,
  SupportsDelete,
  SupportsFindAll,
  SupportsFindById,
  SupportsFindWithPagination,
  SupportsUpdate
} from '../../interfaces/database/database-common.interface';
import { DatabaseAdapter, DatabaseConfig } from '../../interfaces/database/database.interface';
import { MetricsService } from '../../../infrastructure/metrics/metrics.service';

export type AdapterConstructor = new (config: DatabaseConfig, metricsService: MetricsService) => DatabaseAdapter;

export type BulkOperationLogType = 'bulk_create' | 'bulk_delete' | 'bulk_mixed' | 'bulk_update';

export type CrudOperationLogType = 'create' | 'update' | 'delete';

export type BulkOperationType = (typeof BULK_OPERATION_TYPES)[keyof typeof BULK_OPERATION_TYPES];

export type BulkOperationStatusType = 'completed' | 'failed' | 'pending' | 'processing';

export type ChangeIndicatorSeverity = 'high' | 'low' | 'medium';

export type ChangeIndicatorType = 'created' | 'deleted' | 'modified';

export type ConflictType = (typeof CONFLICT_TYPES)[keyof typeof CONFLICT_TYPES];

export type ConflictResolutionStrategy = (typeof CONFLICT_RESOLUTION_STRATEGIES)[keyof typeof CONFLICT_RESOLUTION_STRATEGIES];

export type CrudRepository<Data = unknown, ID = string | number, Result = unknown> = Partial<
  SupportsFindWithPagination<Data> &
    SupportsFindAll<Data> &
    SupportsFindById<Data, ID> &
    SupportsCreate<Data, Result> &
    SupportsUpdate<Data, ID, Result> &
    SupportsDelete<ID, Result> & {
      applyPostProcessing: (data: Data[]) => Promise<void>;
      getSearchableFields: () => string[];
      getColumnMetadata: () => Array<{ name: string; type: string; required: boolean; editable: boolean }>;
      retrieveDataWithPagination: (page: number, limit: number, search?: string) => Promise<{ data: Data[]; total: number }>;
    }
>;

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

export type TableDataResult<T = unknown> = PaginationResult<T>;
