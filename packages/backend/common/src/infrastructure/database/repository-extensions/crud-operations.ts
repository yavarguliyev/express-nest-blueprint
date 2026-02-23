import { DatabaseAdapter } from '../../../domain/interfaces/database/database.interface';
import { QueryWithPaginationOptions } from '../../../domain/interfaces/database/query-builder.interface';
import { JwtPayload } from '../../../domain/interfaces/auth/jwt.interface';
import { QueryBuilder } from '../query-builder';
import { DatabaseService } from '../database.service';

export class CrudOperations<T> {
  async findAll (
    queryBuilder: QueryBuilder<T>,
    databaseService: DatabaseService,
    getSelectColumns: () => string[],
    options: QueryWithPaginationOptions = {},
    connection?: DatabaseAdapter
  ): Promise<T[]> {
    const { query, params } = queryBuilder.buildSelectQuery(getSelectColumns(), options);

    const db = connection || databaseService.getReadConnection();
    const result = await db.query<T>(query, params);

    return result.rows;
  }

  async findById (
    queryBuilder: QueryBuilder<T>,
    databaseService: DatabaseService,
    getSelectColumns: () => string[],
    id: string | number,
    connection?: DatabaseAdapter
  ): Promise<T | null> {
    const { query, params } = queryBuilder.buildSelectQuery(getSelectColumns(), { where: { id } });

    const db = connection || databaseService.getReadConnection();
    const result = await db.query<T>(query, params);

    return (result.rows[0] as T) || null;
  }

  async findOne (
    queryBuilder: QueryBuilder<T>,
    databaseService: DatabaseService,
    getSelectColumns: () => string[],
    where: Record<string, unknown>,
    connection?: DatabaseAdapter
  ): Promise<T | null> {
    const { query, params } = queryBuilder.buildSelectQuery(getSelectColumns(), { where });

    const db = connection || databaseService.getReadConnection();
    const result = await db.query<T>(query, params);

    return (result.rows[0] as T) || null;
  }

  async create<K extends keyof T> (
    queryBuilder: QueryBuilder<T>,
    databaseService: DatabaseService,
    getSelectColumns: () => string[],
    data: Partial<T>,
    returningColumns?: K[],
    connection?: DatabaseAdapter
  ): Promise<Pick<T, K> | null> {
    const { query, params } = queryBuilder.buildInsertQuery(data as Record<string, unknown>, returningColumns ?? (getSelectColumns() as K[]));

    const db = connection || databaseService.getWriteConnection();
    const result = await db.query<Pick<T, K>>(query, params);

    return (result.rows[0] as T) ?? null;
  }

  async update<K extends keyof T> (
    queryBuilder: QueryBuilder<T>,
    databaseService: DatabaseService,
    getSelectColumns: () => string[],
    id: string | number,
    data: Partial<T>,
    returningColumns?: K[],
    connection?: DatabaseAdapter,
    _currentUser?: JwtPayload
  ): Promise<Pick<T, K> | null> {
    const columnsToReturn = returningColumns ?? (getSelectColumns() as K[]);
    const { query, params } = queryBuilder.buildUpdateQuery(id, data as Record<string, unknown>, columnsToReturn.map(String));

    void _currentUser;

    const db = connection || databaseService.getWriteConnection();
    const result = await db.query<T>(query, params);

    return (result.rows[0] as T) || null;
  }

  async delete (
    queryBuilder: QueryBuilder<T>,
    databaseService: DatabaseService,
    id: string | number,
    connection?: DatabaseAdapter,
    _currentUser?: JwtPayload
  ): Promise<boolean> {
    const { query, params } = queryBuilder.buildDeleteQuery(id);

    const db = connection || databaseService.getWriteConnection();
    const result = await db.query(query, params);

    void _currentUser;

    return result.rowCount > 0;
  }

  async count (
    queryBuilder: QueryBuilder<T>,
    databaseService: DatabaseService,
    options: QueryWithPaginationOptions = {},
    connection?: DatabaseAdapter
  ): Promise<number> {
    const { query, params } = queryBuilder.buildCountQuery(options);

    const db = connection || databaseService.getReadConnection();
    const result = await db.query<{ count: string }>(query, params);

    return parseInt(result.rows[0]?.count as string, 10);
  }
}
