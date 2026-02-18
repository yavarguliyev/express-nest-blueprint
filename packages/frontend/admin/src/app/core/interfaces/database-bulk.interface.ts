import { BulkOperationStatusType, ResponseType } from '../types/api.type';
import { BulkOperationTypes } from '../types/api.type';
import { SeverityType } from '../types/dashboard.type';
import { ConflictResolutionStrategy, ConflictType, PermisionType } from '../types/permission.type';
import { OperationResult, BulkOperationResponse } from './database.interface';

export interface DatabaseDraft {
  id: string;
  tableName: string;
  category: string;
  recordId: number | string;
  operation: BulkOperationTypes;
  originalData: Record<string, unknown>;
  draftData: Record<string, unknown>;
  hasChanges: boolean;
  timestamp: Date;
}

export interface DatabaseOperation {
  type: BulkOperationTypes;
  table: string;
  category: string;
  recordId?: number | string;
  data?: Record<string, unknown>;
}

export interface BulkStatus {
  draftCount: number;
  affectedTables: string[];
  hasConflicts: boolean;
  isProcessing: boolean;
}

export interface ChangeIndicator {
  type: ResponseType;
  severity: SeverityType;
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

export interface BulkOperationError {
  type: PermisionType;
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
  operationType: BulkOperationTypes;
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
  status: BulkOperationStatusType;
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
      supportedOperations: BulkOperationTypes[];
    };
  };
}

export interface ColumnMetadata {
  name: string;
  type: string;
  required: boolean;
  editable: boolean;
}
