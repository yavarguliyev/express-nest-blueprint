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
