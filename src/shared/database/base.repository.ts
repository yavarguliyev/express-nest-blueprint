import { Injectable } from '@common/decorators';
import { DatabaseService } from '@core/database/database.service';
import { ColumnMapping, QueryAllWithPaginationOptions, QueryWithPaginationOptions, QueryPaginationOptionsResults } from '@shared/database/interfaces';
import { QueryBuilder } from '@shared/database/query-builder';

@Injectable()
export abstract class BaseRepository<T> {
  protected queryBuilder: QueryBuilder<T>;

  constructor (
    protected readonly databaseService: DatabaseService,
    tableName: string,
    columnMappings: ColumnMapping = {}
  ) {
    this.queryBuilder = new QueryBuilder(tableName, columnMappings);
  }

  async findAll (options: QueryWithPaginationOptions = {}): Promise<T[]> {
    const columns = this.getSelectColumns();
    const { query, params } = this.queryBuilder.buildSelectQuery(columns, options);

    const db = this.databaseService.getReadConnection();
    const result = await db.query<T>(query, params);

    return result.rows;
  }

  async findById (id: number): Promise<T | null> {
    const columns = this.getSelectColumns();
    const { query, params } = this.queryBuilder.buildSelectQuery(columns, { where: { id } });

    const db = this.databaseService.getReadConnection();
    const result = await db.query<T>(query, params);

    return (result.rows[0] as T) || null;
  }

  async findOne (where: Record<string, unknown>): Promise<T | null> {
    const columns = this.getSelectColumns();
    const { query, params } = this.queryBuilder.buildSelectQuery(columns, { where });

    const db = this.databaseService.getReadConnection();
    const result = await db.query<T>(query, params);

    return (result.rows[0] as T) || null;
  }

  async create<K extends keyof T> (data: Partial<T>, returningColumns?: K[]): Promise<Pick<T, K> | null> {
    const columnsToReturn = returningColumns ?? (this.getSelectColumns() as K[]);
    const { query, params } = this.queryBuilder.buildInsertQuery(data as Record<string, unknown>, columnsToReturn);

    const db = this.databaseService.getWriteConnection();
    const result = await db.query<Pick<T, K>>(query, params);

    return (result.rows[0] as T) ?? null;
  }

  async update<K extends keyof T> (id: number, data: Partial<T>, returningColumns?: K[]): Promise<Pick<T, K> | null> {
    const columnsToReturn = returningColumns ?? (this.getSelectColumns() as K[]);
    const { query, params } = this.queryBuilder.buildUpdateQuery(id, data as Record<string, unknown>, columnsToReturn.map(String));

    const db = this.databaseService.getWriteConnection();
    const result = await db.query<T>(query, params);

    return (result.rows[0] as T) || null;
  }

  async delete (id: number): Promise<boolean> {
    const { query, params } = this.queryBuilder.buildDeleteQuery(id);

    const db = this.databaseService.getWriteConnection();
    const result = await db.query(query, params);

    return result.rowCount > 0;
  }

  async count (options: QueryWithPaginationOptions = {}): Promise<number> {
    const { query, params } = this.queryBuilder.buildCountQuery(options);

    const db = this.databaseService.getReadConnection();
    const result = await db.query<{ count: string }>(query, params);

    return parseInt(result.rows[0]?.count as string, 10);
  }

  async findWithPagination (options: QueryWithPaginationOptions & { page: number; limit: number }): Promise<QueryPaginationOptionsResults<T>> {
    const { page, limit, ...queryOptions } = options;

    const offset = (page - 1) * limit;
    const total = await this.count(queryOptions);
    const data = await this.findAll({ ...queryOptions, limit, offset });
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  async findAllWithPagination (options: QueryAllWithPaginationOptions): Promise<QueryPaginationOptionsResults<T>> {
    const { page, limit, search, searchFields, where, orderBy, orderDirection } = options;

    const queryOptions: QueryWithPaginationOptions = {
      orderBy: orderBy || 'id',
      orderDirection: orderDirection || 'ASC'
    };
    if (where) {
      queryOptions.where = where;
    }

    if (search && searchFields && searchFields.length > 0) {
      queryOptions.search = { fields: searchFields, term: search };
    }

    return this.findWithPagination({ ...queryOptions, page, limit });
  }

  protected abstract getSelectColumns(): string[];
}
