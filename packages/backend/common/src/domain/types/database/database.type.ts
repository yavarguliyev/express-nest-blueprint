import { BULK_OPERATION_TYPES, CONFLICT_RESOLUTION_STRATEGIES, CONFLICT_TYPES } from '../../constants/database/database.const';
import {
  SupportsCreate,
  SupportsDelete,
  SupportsFindAll,
  SupportsFindById,
  SupportsFindWithPagination,
  SupportsUpdate
} from '../../interfaces/database/database-common.interface';
import { DatabaseAdapter, DatabaseConfig } from '../../interfaces/database/database.interface';

export type BulkOperationType = (typeof BULK_OPERATION_TYPES)[keyof typeof BULK_OPERATION_TYPES];

export type BulkOperationLogType = 'bulk_create' | 'bulk_update' | 'bulk_delete' | 'bulk_mixed';

export type ConflictType = (typeof CONFLICT_TYPES)[keyof typeof CONFLICT_TYPES];

export type ConflictResolutionStrategy = (typeof CONFLICT_RESOLUTION_STRATEGIES)[keyof typeof CONFLICT_RESOLUTION_STRATEGIES];

export type AdapterConstructor = new (config: DatabaseConfig) => DatabaseAdapter;

export type CrudRepository = Partial<
  SupportsFindWithPagination &
    SupportsFindAll &
    SupportsFindById &
    SupportsCreate &
    SupportsUpdate &
    SupportsDelete & {
      applyPostProcessing: (data: unknown[]) => Promise<void>;
      getSearchableFields: () => string[];
      getColumnMetadata: () => Array<{ name: string; type: string; required: boolean; editable: boolean }>;
      retrieveDataWithPagination: (page: number, limit: number, search?: string) => Promise<{ data: unknown[]; total: number }>;
    }
>;
