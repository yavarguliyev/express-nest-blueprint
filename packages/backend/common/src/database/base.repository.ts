import { DatabaseService } from './database.service';
import { QueryBuilder } from './query-builder';
import { Injectable } from '../decorators/injectable.decorator';
import { NotFoundException } from '../exceptions/http-exceptions';
import { convertValueToSearchableString } from '../helpers/utility-functions.helper';
import { DatabaseAdapter } from '../interfaces/database.interface';
import { ColumnMapping, QueryAllWithPaginationOptions, QueryWithPaginationOptions, QueryPaginationOptionsResults } from '../interfaces/query-builder.interface';
import { JwtPayload } from '../interfaces/common.interface';

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

  protected abstract getSelectColumns(): string[];

  applyPostProcessing (data: unknown[]): Promise<void> {
    void data;
    return Promise.resolve();
  }

  getSearchableFields (): string[] {
    const allFields = this.getSelectColumns();
    const excludeFields = ['id', 'password', 'passwordHash', 'password_hash', 'createdAt', 'updatedAt', 'created_at', 'updated_at'];
    return allFields.filter((field) => !excludeFields.includes(field));
  }

  getColumnMetadata (): Array<{ name: string; type: string; required: boolean; editable: boolean }> {
    const columns = this.getSelectColumns();
    return columns.map((columnName) => ({
      name: columnName,
      type: this.inferColumnType(columnName),
      required: this.isColumnRequired(columnName),
      editable: this.isColumnEditable(columnName)
    }));
  }

  protected inferColumnType (columnName: string): string {
    if (columnName === 'id') return 'number';
    if (columnName.includes('Date') || columnName.includes('At')) return 'datetime';
    if (columnName.startsWith('is') || columnName.includes('Active') || columnName.includes('Verified')) return 'boolean';
    return 'string';
  }

  protected isColumnRequired (columnName: string): boolean {
    const optionalFields = ['profileImageUrl', 'lastLogin'];
    return !optionalFields.includes(columnName);
  }

  protected isColumnEditable (columnName: string): boolean {
    const nonEditableFields = ['id', 'createdAt', 'updatedAt', 'lastLogin'];
    return !nonEditableFields.includes(columnName);
  }

  async retrieveDataWithPagination (page: number, limit: number, search?: string): Promise<{ data: unknown[]; total: number }> {
    let data: unknown[] = [];
    let total = 0;

    if (this.findWithPagination) {
      const result = await this.findWithPagination({ page, limit });
      data = result.data;
      total = result.total;

      if (search && search.trim()) {
        data = this.applySearch(data, search.trim());
        total = data.length;
        data = this.paginateArray(data, page, limit);
      }
    } else if (this.findAll) {
      const offset = (page - 1) * limit;
      data = await this.findAll({ limit, offset });
      total = data.length;

      if (search && search.trim()) {
        data = this.applySearch(data, search.trim());
        total = data.length;
        data = this.paginateArray(data, page, limit);
      }
    } else throw new NotFoundException('Repository does not support data retrieval');

    await this.applyPostProcessing(data);

    return { data, total };
  }

  async findAll (options: QueryWithPaginationOptions = {}, connection?: DatabaseAdapter): Promise<T[]> {
    const columns = this.getSelectColumns();
    const { query, params } = this.queryBuilder.buildSelectQuery(columns, options);

    const db = connection || this.databaseService.getReadConnection();
    const result = await db.query<T>(query, params);

    return result.rows;
  }

  async findById (id: string | number, connection?: DatabaseAdapter): Promise<T | null> {
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

  async update<K extends keyof T> (id: string | number, data: Partial<T>, returningColumns?: K[], connection?: DatabaseAdapter, _currentUser?: JwtPayload): Promise<Pick<T, K> | null> {
    const columnsToReturn = returningColumns ?? (this.getSelectColumns() as K[]);
    const { query, params } = this.queryBuilder.buildUpdateQuery(id, data as Record<string, unknown>, columnsToReturn.map(String));

    void _currentUser;

    const db = connection || this.databaseService.getWriteConnection();
    const result = await db.query<T>(query, params);

    return (result.rows[0] as T) || null;
  }

  async delete (id: string | number, connection?: DatabaseAdapter, _currentUser?: JwtPayload): Promise<boolean> {
    const { query, params } = this.queryBuilder.buildDeleteQuery(id);

    const db = connection || this.databaseService.getWriteConnection();
    const result = await db.query(query, params);

    void _currentUser;

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

    const queryOptions: QueryWithPaginationOptions = { orderBy: orderBy || 'id', orderDirection: orderDirection || 'ASC' };

    if (where) queryOptions.where = where;
    if (search && searchFields && searchFields.length > 0) queryOptions.search = { fields: searchFields, term: search };

    return this.findWithPagination({ ...queryOptions, page, limit }, connection);
  }

  private applySearch (data: unknown[], searchTerm: string): unknown[] {
    if (!searchTerm || !data.length) return data;

    const lowerSearchTerm = searchTerm.toLowerCase();
    const searchableFields = this.getSearchableFields();

    return data.filter((record) => {
      if (!record || typeof record !== 'object') return false;

      return searchableFields.some((field) => {
        const value = (record as Record<string, unknown>)[field];
        if (value === null || value === undefined) return false;
        return convertValueToSearchableString(value).toLowerCase().includes(lowerSearchTerm);
      });
    });
  }

  private paginateArray (data: unknown[], page: number, limit: number): unknown[] {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return data.slice(startIndex, endIndex);
  }
}
