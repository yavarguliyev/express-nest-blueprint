export const BULK_OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export type BulkOperationType = (typeof BULK_OPERATION_TYPES)[keyof typeof BULK_OPERATION_TYPES];

export const CONFLICT_TYPES = {
  CONCURRENT_MODIFICATION: 'concurrent_modification',
  PERMISSION_DENIED: 'permission_denied',
  CONSTRAINT_VIOLATION: 'constraint_violation',
} as const;

export type ConflictType = (typeof CONFLICT_TYPES)[keyof typeof CONFLICT_TYPES];

export const CONFLICT_RESOLUTION_STRATEGIES = {
  KEEP_MINE: 'keep_mine',
  USE_THEIRS: 'use_theirs',
  MERGE: 'merge',
  SKIP: 'skip',
} as const;

export type ConflictResolutionStrategy =
  (typeof CONFLICT_RESOLUTION_STRATEGIES)[keyof typeof CONFLICT_RESOLUTION_STRATEGIES];

export interface DatabaseDraft {
  id: string;
  tableName: string;
  category: string;
  recordId: number | string;
  operation: BulkOperationType;
  originalData: Record<string, unknown>;
  draftData: Record<string, unknown>;
  hasChanges: boolean;
  timestamp: Date;
}

export interface DatabaseOperation {
  type: BulkOperationType;
  table: string;
  category: string;
  recordId?: number | string;
  data?: Record<string, unknown>;
}

export interface BulkOperationRequest {
  operations: DatabaseOperation[];
  validateOnly?: boolean;
}

export interface OperationResult {
  operation: DatabaseOperation;
  success: boolean;
  error?: string;
  data?: unknown;
}

export interface OperationSummary {
  total: number;
  successful: number;
  failed: number;
}

export interface BulkOperationResponse {
  success: boolean;
  results: OperationResult[];
  summary: OperationSummary;
}

export interface BulkStatus {
  draftCount: number;
  affectedTables: string[];
  hasConflicts: boolean;
  isProcessing: boolean;
}

export interface ChangeIndicator {
  type: 'modified' | 'created' | 'deleted';
  severity: 'low' | 'medium' | 'high';
  tooltip: string;
}

export interface ChangeSummary {
  table: string;
  category: string;
  changes: ChangeCount;
}

export interface ChangeCount {
  created: number;
  updated: number;
  deleted: number;
}

export interface ValidationResult {
  valid: boolean;
  validationResults: ValidationItem[];
  conflicts: ConflictItem[];
}

export interface ValidationItem {
  operation: DatabaseOperation;
  valid: boolean;
  warnings: string[];
}

export interface ConflictItem {
  recordId: number | string;
  table: string;
  conflictType: ConflictType;
  lastModified?: string;
  modifiedBy?: string;
  conflictedFields?: string[];
  details: string;
}

export interface ConflictResolution {
  strategy: ConflictResolutionStrategy;
  conflictedFields: string[];
  resolution: Record<string, unknown>;
}

export interface DraftStorage {
  version: string;
  timestamp: Date;
  drafts: Record<string, DatabaseDraft>;
  metadata: {
    totalChanges: number;
    affectedTables: string[];
    lastModified: Date;
  };
}

export interface BulkOperationError {
  type: 'validation' | 'conflict' | 'permission' | 'network' | 'server';
  message: string;
  operation?: DatabaseOperation;
  details?: Record<string, unknown>;
}

export interface ChangePreviewModal {
  changes: ChangeSummary[];
  totalOperations: number;
  estimatedTime: string;
  warnings: string[];
}

export interface BulkOperationLog {
  id: string;
  userId: number;
  operationType: 'bulk_create' | 'bulk_update' | 'bulk_delete' | 'bulk_mixed';
  affectedTables: string[];
  operationCount: number;
  successCount: number;
  failureCount: number;
  executionTime: number;
  timestamp: Date;
  details: OperationResult[];
}

export interface BulkOperationStatus {
  operationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results?: BulkOperationResponse;
}

export interface EnhancedTableMetadata {
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
      supportedOperations: BulkOperationType[];
    };
  };
}

export interface ColumnMetadata {
  name: string;
  type: string;
  required: boolean;
  editable: boolean;
}
