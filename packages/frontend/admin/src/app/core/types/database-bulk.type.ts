import { BULK_OPERATION_TYPES, CONFLICT_TYPES, CONFLICT_RESOLUTION_STRATEGIES } from '../constants/database-bulk.const';

export type BulkOperationType = (typeof BULK_OPERATION_TYPES)[keyof typeof BULK_OPERATION_TYPES];

export type ConflictType = (typeof CONFLICT_TYPES)[keyof typeof CONFLICT_TYPES];

export type ConflictResolutionStrategy = (typeof CONFLICT_RESOLUTION_STRATEGIES)[keyof typeof CONFLICT_RESOLUTION_STRATEGIES];
