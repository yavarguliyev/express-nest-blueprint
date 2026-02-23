import { IdType, SortOrder, WhereConditions } from '../../types/common/util.type';
import { CrudRepository } from '../../types/database/database.type';

export interface CrudTableOptions {
  category: string;
  name: string;
  displayName?: string;
  commandQueue?: string;
  operationMapping?: Record<string, string>;
  cacheConfig?: {
    prefix: string;
    detailKey?: (id: string | number) => string;
  };
  actions?: {
    create?: boolean;
    update?: boolean;
    delete?: boolean;
  };
}

export interface PaginationResult<T = unknown> {
  data: T[];
  total: number;
}

export interface SupportsFindWithPagination<T = unknown> {
  findWithPagination(options: { page: number; limit: number }): Promise<PaginationResult<T>>;
}

export interface SupportsFindAll<T = unknown> {
  findAll(options: { limit: number; offset: number }): Promise<T[]>;
}

export interface SupportsFindById<T = unknown, ID = IdType> {
  findById(id: ID): Promise<T>;
}

export interface SupportsCreate<T = unknown, Result = T> {
  create(data: T): Promise<Result>;
}

export interface SupportsUpdate<T = unknown, ID = IdType, Result = T> {
  update(id: ID, data: T): Promise<Result>;
}

export interface SupportsDelete<ID = IdType, Result = boolean> {
  delete(id: ID): Promise<Result>;
}

export interface RepositoryEntry {
  repository: CrudRepository;
  metadata: CrudTableOptions;
}

export interface ColumnMapping {
  [key: string]: string;
}

export interface WhereCondition {
  field: string;
  operator: WhereConditions;
  value: unknown;
}

export interface WithWhere<W = Record<string, unknown> | WhereCondition[]> {
  where?: W;
}

export type SearchOption = string | { fields: string[]; term: string };

export interface WithSearch<S = SearchOption> {
  search?: S;
  searchFields?: string[];
}

export interface WithOrder {
  orderBy?: string;
  orderDirection?: SortOrder;
}

export interface WithPagination {
  page?: number;
  limit?: number;
  offset?: number;
}
