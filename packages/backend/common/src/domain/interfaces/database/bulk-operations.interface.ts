import { OperationStatus } from '../../types/common/status.type';
import { BulkOperationType, ConflictType, BulkOperationLogType, ConflictResolutionStrategy } from '../../types/database/database.type';
import { JwtPayload } from '../auth/jwt.interface';
import {
  WithTable,
  WithRecordId,
  WithOperation,
  WithSuccess,
  OperationCounts,
  WithValidity,
  WithConflictedFields,
  ExecutionCounts
} from '../common/base.interface';

export interface DatabaseOperation extends WithTable, WithRecordId {
  type: BulkOperationType;
  category: string;
  data?: Record<string, unknown>;
}

export interface BulkOperationRequestWithUser {
  operations: DatabaseOperation[];
  user: JwtPayload;
}

export interface BulkOperationRequest {
  operations: DatabaseOperation[];
  validateOnly?: boolean;
}

export interface OperationResult extends WithOperation, WithSuccess {
  error?: string;
  data?: unknown;
}

export interface BulkOperationResponse extends WithSuccess {
  results: OperationResult[];
  summary: OperationCounts;
  jobId?: string;
}

export interface ValidationResult extends WithValidity {
  validationResults: ValidationItem[];
  conflicts: ConflictItem[];
}

export interface ValidationItem extends WithOperation, WithValidity {
  warnings: string[];
}

export interface ConflictItem extends WithTable, WithRecordId, WithConflictedFields {
  conflictType: ConflictType;
  lastModified?: string;
  modifiedBy?: string;
  details: string;
}

export interface BulkOperationLog extends ExecutionCounts {
  id: string;
  userId: number;
  operationType: BulkOperationLogType;
  affectedTables: string[];
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
