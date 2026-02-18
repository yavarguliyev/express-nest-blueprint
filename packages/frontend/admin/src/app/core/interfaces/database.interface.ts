import { BulkOperationType } from '../types/api.type';

export interface Column {
  name: string;
  type: string;
  required: boolean;
  editable: boolean;
}

export interface TableActions {
  create?: boolean;
  update?: boolean;
  delete?: boolean;
}

export interface TableMetadata {
  category: string;
  name: string;
  displayName: string;
  tableName: string;
  columns: Column[];
  actions?: TableActions;
}

export interface Schema {
  [category: string]: TableMetadata[];
}

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
  success: boolean;
  operation: DatabaseOperation;
  data?: Record<string, unknown>;
  error?: string;
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

export interface FieldValidationResult {
  field: string;
  valid: boolean;
  message?: string;
}

export interface DataConflict {
  recordId: number | string;
  field: string;
  currentValue: unknown;
  attemptedValue: unknown;
}

export interface ValidationItem {
  operation: DatabaseOperation;
  valid: boolean;
  warnings: string[];
}

export interface ConflictItem {
  recordId: number | string;
  table: string;
  conflictType: string;
  lastModified?: string;
  modifiedBy?: string;
  conflictedFields?: string[];
  details: string;
}

export interface ValidationResult {
  valid: boolean;
  validationResults: ValidationItem[];
  conflicts: ConflictItem[];
}

export interface DraftMetadata {
  totalChanges: number;
  affectedTables: string[];
  lastModified: Date;
}

export interface DraftStorage {
  version: string;
  timestamp: Date;
  drafts: Record<string, DatabaseDraft>;
  metadata: DraftMetadata;
}

export interface GqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}
