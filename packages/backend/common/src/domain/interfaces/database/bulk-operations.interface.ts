import { BulkOperationLogType, BulkOperationType, ConflictResolutionStrategy, ConflictType } from '../../types/database/database.type';
import { OperationStatus } from '../../types/common/status.type';
import { IdType } from '../../types/common/util.type';

export interface DatabaseOperation {
  type: BulkOperationType;
  table: string;
  category: string;
  recordId?: IdType;
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
  jobId?: string;
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
  recordId: IdType;
  table: string;
  conflictType: ConflictType;
  lastModified?: string;
  modifiedBy?: string;
  conflictedFields?: string[];
  details: string;
}

export interface BulkOperationLog {
  id: string;
  userId: number;
  operationType: BulkOperationLogType;
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
  status: OperationStatus;
  progress: number;
  results?: BulkOperationResponse;
}

export interface ConflictResolution {
  strategy: ConflictResolutionStrategy;
  conflictedFields: string[];
  resolution: Record<string, unknown>;
}
