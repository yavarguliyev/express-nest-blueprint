import { IdType } from '../../types/common/util.type';
import { HealthStatus } from '../../types/common/status.type';
import { DatabaseOperation } from '../database/bulk-operations.interface';

export interface BaseHealthComponent {
  status: HealthStatus;
  error?: string;
}

export interface Timestamped {
  timestamp: string;
}

export interface Prefixed {
  prefix?: string;
}

export interface Versioned {
  version: string;
}

export interface OptionalVersioned {
  version?: string;
}

export interface WithPath {
  path: string;
}

export interface WithId<ID = IdType> {
  id: ID;
}

export interface WithName {
  name: string;
}

export interface WithCategory {
  category: string;
}

export interface WithDescription {
  description: string;
}

export interface WithNullableDescription {
  description: string | null;
}

export interface OptionalPath {
  path?: string;
}

export interface WithCreatedAt<T = Date> {
  createdAt: T;
}

export interface WithUpdatedAt<T = Date> {
  updatedAt: T;
}

export interface Auditable<T = Date> extends WithCreatedAt<T>, WithUpdatedAt<T> {}

export interface RequiresAuth {
  requiresAuth: boolean;
}

export interface WithInstance<T extends object> {
  instance: T;
}

export interface WithMethodName<K extends PropertyKey = string> {
  methodName: K;
}

export interface WithCallbackArgs<Args extends unknown[]> {
  callbackArgs: Args;
}

export interface WithAsyncCallback<Args extends unknown[]> {
  shutdownCallback: (...args: Args) => Promise<void>;
}

export interface WithSuccess {
  success: boolean;
}

export interface WithValidity {
  valid: boolean;
}

export interface WithOperation {
  operation: DatabaseOperation;
}

export interface WithTable {
  table: string;
}

export interface WithRecordId {
  recordId: IdType;
}

export interface OperationCounts {
  total: number;
  successful: number;
  failed: number;
}

export interface ExecutionCounts {
  operationCount: number;
  successCount: number;
  failureCount: number;
}

export interface WithConflictedFields {
  conflictedFields?: string[];
}
