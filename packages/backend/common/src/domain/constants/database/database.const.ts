import { DatabaseType } from '../../enums/database/database.enum';
import { AdapterConstructor } from '../../types/database/database.type';
import { SortBy, SortOrder } from '../../types/common/util.type';
import { PostgreSQLAdapter } from '../../../infrastructure/database/adapters/postgresql.adapter';

export const DATABASE_ADAPTER_MAP: Record<DatabaseType, AdapterConstructor> = {
  [DatabaseType.POSTGRESQL]: PostgreSQLAdapter
};

export const SORT_BY_VALUES: readonly SortBy[] = ['id', 'firstName', 'lastName', 'email', 'createdAt'];

export const SORT_ORDER_VALUES: readonly SortOrder[] = ['ASC', 'DESC'];

export const BULK_OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
} as const;

export const CONFLICT_TYPES = {
  CONCURRENT_MODIFICATION: 'concurrent_modification',
  PERMISSION_DENIED: 'permission_denied',
  CONSTRAINT_VIOLATION: 'constraint_violation'
} as const;

export const CONFLICT_RESOLUTION_STRATEGIES = {
  KEEP_MINE: 'keep_mine',
  USE_THEIRS: 'use_theirs',
  MERGE: 'merge',
  SKIP: 'skip'
} as const;
