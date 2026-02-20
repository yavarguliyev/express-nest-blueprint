import { DatabaseAdapter } from '../../../domain/interfaces/database/database.interface';
import {
  QueryAllWithPaginationOptions,
  QueryPaginationOptionsResults,
  QueryWithPaginationOptions
} from '../../../domain/interfaces/database/query-builder.interface';

export class TransactionMethods<T> {
  async findAllWithPagination (
    options: QueryAllWithPaginationOptions,
    connection: DatabaseAdapter | undefined,
    _count: (options: QueryWithPaginationOptions, connection?: DatabaseAdapter) => Promise<number>,
    _findAll: (options: QueryWithPaginationOptions, connection?: DatabaseAdapter) => Promise<T[]>,
    findWithPagination: (
      options: QueryWithPaginationOptions & { page: number; limit: number },
      connection?: DatabaseAdapter
    ) => Promise<QueryPaginationOptionsResults<T>>
  ): Promise<QueryPaginationOptionsResults<T>> {
    const { page, limit, search, searchFields, where, orderBy, orderDirection } = options;

    const queryOptions: QueryWithPaginationOptions = {
      orderBy: orderBy || 'id',
      orderDirection: orderDirection || 'ASC'
    };

    if (where) queryOptions.where = where;
    if (search && searchFields && searchFields.length > 0) queryOptions.search = { fields: searchFields, term: search };

    return findWithPagination({ ...queryOptions, page, limit }, connection);
  }

  async findWithPagination (
    options: QueryWithPaginationOptions & { page: number; limit: number },
    connection: DatabaseAdapter | undefined,
    count: (options: QueryWithPaginationOptions, connection?: DatabaseAdapter) => Promise<number>,
    findAll: (options: QueryWithPaginationOptions, connection?: DatabaseAdapter) => Promise<T[]>
  ): Promise<QueryPaginationOptionsResults<T>> {
    const { page, limit, ...queryOptions } = options;

    const offset = (page - 1) * limit;
    const total = await count(queryOptions, connection);
    const data = await findAll({ ...queryOptions, limit, offset }, connection);
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }
}
