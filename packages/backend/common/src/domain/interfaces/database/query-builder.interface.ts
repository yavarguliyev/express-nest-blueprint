import { WithWhere, WithSearch, WithOrder, WithPagination } from './database-common.interface';

export interface QueryWithPaginationOptions extends WithWhere, WithSearch<{ fields: string[]; term: string }>, WithOrder, WithPagination {}

export interface QueryAllWithPaginationOptions extends WithWhere<Record<string, unknown>>, WithSearch<string>, WithOrder, WithPagination {
  page: number;
  limit: number;
}

export interface QueryPaginationOptionsResults<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
