import { IdType } from '../../types/common/util.type';
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

export interface SupportsFindWithPagination {
  findWithPagination(options: { page: number; limit: number }): Promise<PaginationResult>;
}

export interface SupportsFindAll {
  findAll(options: { limit: number; offset: number }): Promise<unknown[]>;
}

export interface SupportsFindById {
  findById(id: IdType): Promise<unknown>;
}

export interface SupportsCreate {
  create(data: unknown): Promise<unknown>;
}

export interface SupportsUpdate {
  update(id: IdType, data: unknown): Promise<unknown>;
}

export interface SupportsDelete {
  delete(id: IdType): Promise<boolean>;
}

export interface RepositoryEntry {
  repository: CrudRepository;
  metadata: CrudTableOptions;
}
