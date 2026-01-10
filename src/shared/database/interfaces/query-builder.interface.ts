import { SortOrder, WhereConditions } from '@common/types';

export interface ColumnMapping {
  [key: string]: string;
}

export interface WhereCondition {
  field: string;
  operator: WhereConditions;
  value: unknown;
}

export interface QueryWithPaginationOptions {
  where?: Record<string, unknown> | WhereCondition[];
  search?: { fields: string[]; term: string };
  orderBy?: string;
  orderDirection?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface QueryAllWithPaginationOptions {
  page: number;
  limit: number;
  search?: string;
  searchFields?: string[];
  where?: Record<string, unknown>;
  orderBy?: string;
  orderDirection?: SortOrder;
}

export interface QueryPaginationOptionsResults<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
