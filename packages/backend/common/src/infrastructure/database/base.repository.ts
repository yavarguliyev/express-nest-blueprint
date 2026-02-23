import { DatabaseService } from './database.service';
import { QueryBuilder } from './query-builder';
import { Injectable } from '../../core/decorators/injectable.decorator';
import {
  QueryAllWithPaginationOptions,
  QueryPaginationOptionsResults,
  QueryWithPaginationOptions
} from '../../domain/interfaces/database/query-builder.interface';
import { DatabaseAdapter } from '../../domain/interfaces/database/database.interface';
import { JwtPayload } from '../../domain/interfaces/auth/jwt.interface';
import { QueryMethods } from './repository-extensions/query-methods';
import { TransactionMethods } from './repository-extensions/transaction-methods';
import { CrudOperations } from './repository-extensions/crud-operations';
import { ColumnMapping } from '../../domain/interfaces/database/database-common.interface';

@Injectable()
export abstract class BaseRepository<T> {
  protected queryBuilder: QueryBuilder<T>;
  private queryMethods: QueryMethods<T>;
  private transactionMethods: TransactionMethods<T>;
  private crudOperations: CrudOperations<T>;

  constructor (
    protected readonly databaseService: DatabaseService,
    tableName: string,
    columnMappings: ColumnMapping = {}
  ) {
    this.queryBuilder = new QueryBuilder(tableName, columnMappings);
    this.queryMethods = new QueryMethods<T>();
    this.transactionMethods = new TransactionMethods<T>();
    this.crudOperations = new CrudOperations<T>();
  }

  protected abstract getSelectColumns(): string[];

  applyPostProcessing (data: unknown[]): Promise<void> {
    void data;
    return Promise.resolve();
  }

  getColumnMetadata (): Array<{ name: string; type: string; required: boolean; editable: boolean }> {
    return this.queryMethods.getColumnMetadata(
      this.getSelectColumns.bind(this),
      this.inferColumnType.bind(this),
      this.isColumnRequired.bind(this),
      this.isColumnEditable.bind(this)
    );
  }

  getSearchableFields (): string[] {
    return this.queryMethods.getSearchableFields(this.getSelectColumns());
  }

  protected inferColumnType (columnName: string): string {
    return this.queryMethods.inferColumnType(columnName);
  }

  protected isColumnRequired (columnName: string): boolean {
    return this.queryMethods.isColumnRequired(columnName);
  }

  protected isColumnEditable (columnName: string): boolean {
    return this.queryMethods.isColumnEditable(columnName);
  }

  async retrieveDataWithPagination (page: number, limit: number, search?: string): Promise<{ data: unknown[]; total: number }> {
    return this.queryMethods.retrieveDataWithPagination(
      page,
      limit,
      search,
      this.findWithPagination?.bind(this),
      this.findAll?.bind(this),
      this.applyPostProcessing.bind(this),
      this.getSearchableFields.bind(this)
    );
  }

  async findAll (options: QueryWithPaginationOptions = {}, connection?: DatabaseAdapter): Promise<T[]> {
    return this.crudOperations.findAll(this.queryBuilder, this.databaseService, this.getSelectColumns.bind(this), options, connection);
  }

  async findById (id: string | number, connection?: DatabaseAdapter): Promise<T | null> {
    return this.crudOperations.findById(this.queryBuilder, this.databaseService, this.getSelectColumns.bind(this), id, connection);
  }

  async findOne (where: Record<string, unknown>, connection?: DatabaseAdapter): Promise<T | null> {
    return this.crudOperations.findOne(this.queryBuilder, this.databaseService, this.getSelectColumns.bind(this), where, connection);
  }

  async create<K extends keyof T> (data: Partial<T>, returningColumns?: K[], connection?: DatabaseAdapter): Promise<Pick<T, K> | null> {
    return this.crudOperations.create(this.queryBuilder, this.databaseService, this.getSelectColumns.bind(this), data, returningColumns, connection);
  }

  async update<K extends keyof T> (
    id: string | number,
    data: Partial<T>,
    returningColumns?: K[],
    connection?: DatabaseAdapter,
    _currentUser?: JwtPayload
  ): Promise<Pick<T, K> | null> {
    return this.crudOperations.update(
      this.queryBuilder,
      this.databaseService,
      this.getSelectColumns.bind(this),
      id,
      data,
      returningColumns,
      connection,
      _currentUser
    );
  }

  async delete (id: string | number, connection?: DatabaseAdapter, _currentUser?: JwtPayload): Promise<boolean> {
    return this.crudOperations.delete(this.queryBuilder, this.databaseService, id, connection, _currentUser);
  }

  async count (options: QueryWithPaginationOptions = {}, connection?: DatabaseAdapter): Promise<number> {
    return this.crudOperations.count(this.queryBuilder, this.databaseService, options, connection);
  }

  async findWithPagination (
    options: QueryWithPaginationOptions & { page: number; limit: number },
    connection?: DatabaseAdapter
  ): Promise<QueryPaginationOptionsResults<T>> {
    return this.transactionMethods.findWithPagination(options, connection, this.count.bind(this), this.findAll.bind(this));
  }

  async findAllWithPagination (options: QueryAllWithPaginationOptions, connection?: DatabaseAdapter): Promise<QueryPaginationOptionsResults<T>> {
    return this.transactionMethods.findAllWithPagination(
      options,
      connection,
      this.count.bind(this),
      this.findAll.bind(this),
      this.findWithPagination.bind(this)
    );
  }
}
