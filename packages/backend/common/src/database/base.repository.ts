import { Injectable } from '../decorators/injectable.decorator';
import { DatabaseService } from './database.service';
import { ColumnMapping, QueryAllWithPaginationOptions, QueryWithPaginationOptions, QueryPaginationOptionsResults } from './interfaces/query-builder.interface';
import { DatabaseAdapter } from '../interfaces/database.interface';
import { QueryBuilder } from './query-builder';

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

  async findAll (options: QueryWithPaginationOptions = {}, connection?: DatabaseAdapter): Promise<T[]> {
    const columns = this.getSelectColumns();
    const { query, params } = this.queryBuilder.buildSelectQuery(columns, options);

    const db = connection || this.databaseService.getReadConnection();
    const result = await db.query<T>(query, params);

    return result.rows;
  }

  async findById (id: number, connection?: DatabaseAdapter): Promise<T | null> {
    const columns = this.getSelectColumns();
    const { query, params } = this.queryBuilder.buildSelectQuery(columns, { where: { id } });

    const db = connection || this.databaseService.getReadConnection();
    const result = await db.query<T>(query, params);

    return (result.rows[0] as T) || null;
  }

  async findOne (where: Record<string, unknown>, connection?: DatabaseAdapter): Promise<T | null> {
    const columns = this.getSelectColumns();
    const { query, params } = this.queryBuilder.buildSelectQuery(columns, { where });

    const db = connection || this.databaseService.getReadConnection();
    const result = await db.query<T>(query, params);

    return (result.rows[0] as T) || null;
  }

  async create<K extends keyof T> (data: Partial<T>, returningColumns?: K[], connection?: DatabaseAdapter): Promise<Pick<T, K> | null> {
    const columnsToReturn = returningColumns ?? (this.getSelectColumns() as K[]);
    const { query, params } = this.queryBuilder.buildInsertQuery(data as Record<string, unknown>, columnsToReturn);

    const db = connection || this.databaseService.getWriteConnection();
    const result = await db.query<Pick<T, K>>(query, params);

    return (result.rows[0] as T) ?? null;
  }

  async update<K extends keyof T> (id: number, data: Partial<T>, returningColumns?: K[], connection?: DatabaseAdapter): Promise<Pick<T, K> | null> {
    const columnsToReturn = returningColumns ?? (this.getSelectColumns() as K[]);
    const { query, params } = this.queryBuilder.buildUpdateQuery(id, data as Record<string, unknown>, columnsToReturn.map(String));

    const db = connection || this.databaseService.getWriteConnection();
    const result = await db.query<T>(query, params);

    return (result.rows[0] as T) || null;
  }

  async delete (id: number, connection?: DatabaseAdapter): Promise<boolean> {
    const { query, params } = this.queryBuilder.buildDeleteQuery(id);

    const db = connection || this.databaseService.getWriteConnection();
    const result = await db.query(query, params);

    return result.rowCount > 0;
  }

  async count (options: QueryWithPaginationOptions = {}, connection?: DatabaseAdapter): Promise<number> {
    const { query, params } = this.queryBuilder.buildCountQuery(options);

    const db = connection || this.databaseService.getReadConnection();
    const result = await db.query<{ count: string }>(query, params);

    return parseInt(result.rows[0]?.count as string, 10);
  }

  async findWithPagination (options: QueryWithPaginationOptions & { page: number; limit: number }, connection?: DatabaseAdapter): Promise<QueryPaginationOptionsResults<T>> {
    const { page, limit, ...queryOptions } = options;

    const offset = (page - 1) * limit;
    const total = await this.count(queryOptions, connection);
    const data = await this.findAll({ ...queryOptions, limit, offset }, connection);
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  async findAllWithPagination (options: QueryAllWithPaginationOptions, connection?: DatabaseAdapter): Promise<QueryPaginationOptionsResults<T>> {
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

    return this.findWithPagination({ ...queryOptions, page, limit }, connection);
  }

  protected abstract getSelectColumns(): string[];
}
