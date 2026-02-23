import { Injectable, NotFoundException, QueueManagerHelper, TableDataResult, WithSuccess, CacheInvalidator, RepositoryManager } from '@config/libs';

import {
  CreateTableOperation,
  DeleteTableOperation,
  TableDataByNameOperationParams,
  TableDataByNameParams,
  TableDataParams,
  TableMetadata,
  TableRecordParams,
  UpdateTableOperation
} from '@modules/admin/interfaces/admin.interface';
import { CreateOperations } from '@modules/admin/services/crud-operations/operations/create-operations';
import { ReadOperations } from '@modules/admin/services/crud-operations/operations/read-operations';
import { UpdateOperations } from '@modules/admin/services/crud-operations/operations/update-operations';
import { DeleteOperations } from '@modules/admin/services/crud-operations/operations/delete-operations';
import { RepositoryRegistrar } from '@modules/admin/services/crud-operations/repository-registrar';
import { SchemaBuilder } from '@modules/admin/services/crud-operations/schema-builder';
import { BaseOperationParams } from '@modules/admin/interfaces/admin-crud.interface';

@Injectable()
export class AdminCrudService {
  constructor (
    private readonly repositoryManager: RepositoryManager,
    private readonly queueHelper: QueueManagerHelper,
    private readonly schemaBuilder: SchemaBuilder,
    private readonly cacheInvalidator: CacheInvalidator,
    private readonly createOps: CreateOperations,
    private readonly readOps: ReadOperations,
    private readonly updateOps: UpdateOperations,
    private readonly deleteOps: DeleteOperations,
    repositoryRegistrar: RepositoryRegistrar
  ) {
    repositoryRegistrar.registerAll(this.repositoryManager);
  }

  getTableSchema (): Record<string, TableMetadata[]> {
    return this.schemaBuilder.buildTableSchema(this.repositoryManager.getAllRepositories(), (repos, name) =>
      this.readOps.getTableColumns(repos, name)
    );
  }

  async getTableData (params: TableDataParams): Promise<TableDataResult> {
    const { category, name, pageNum, limitNum, search, t } = params;
    const key = `${category}:${name}`;
    const entry = this.repositoryManager.getRepository(key);
    const queryParams: TableDataParams = {
      category,
      name,
      pageNum,
      limitNum,
      search,
      ...(entry ? { entry } : {}),
      ...(t ? { t } : {})
    };

    return this.readOps.getTableData(queryParams);
  }

  async getTableDataByName (params: TableDataByNameParams): Promise<TableDataResult> {
    const { name, pageNum, limitNum, search } = params;
    const entry = this.readOps.findRepositoryByName(this.repositoryManager.getAllRepositories(), name);
    const queryParams: TableDataByNameOperationParams = { name, pageNum, limitNum, search, ...(entry ? { entry } : {}) };
    return this.readOps.getTableDataByName(queryParams);
  }

  async getTableRecord (params: TableRecordParams): Promise<unknown> {
    const { category, name, id } = params;
    const key = `${category}:${name}`;
    const entry = this.repositoryManager.getRepository(key);
    return this.readOps.getTableRecord({ category, name, id, ...(entry ? { entry } : {}) });
  }

  async createTableRecord (params: CreateTableOperation): Promise<unknown> {
    const { category, name, data, currentUser, bypassQueue = false } = params;

    const entry = this.repositoryManager.getRepository(`${category}:${name}`);
    if (!entry) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);

    const { repository, metadata } = entry;

    const operationParams: BaseOperationParams = {
      repository,
      metadata,
      category,
      name,
      data,
      bypassQueue,
      waitForJobCompletion: this.queueHelper.waitForJobCompletion.bind(this.queueHelper),
      invalidateCache: this.cacheInvalidator.invalidateCache.bind(this.cacheInvalidator),
      ...(currentUser ? { currentUser } : {})
    };

    return this.createOps.execute(operationParams);
  }

  async updateTableRecord (params: UpdateTableOperation): Promise<unknown> {
    const { category, name, id, data, currentUser, bypassQueue = false } = params;

    const entry = this.repositoryManager.getRepository(`${category}:${name}`);
    if (!entry) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);

    const { repository, metadata } = entry;

    const operationParams: BaseOperationParams = {
      repository,
      metadata,
      category,
      name,
      id,
      data,
      bypassQueue,
      waitForJobCompletion: this.queueHelper.waitForJobCompletion.bind(this.queueHelper),
      invalidateCache: this.cacheInvalidator.invalidateCache.bind(this.cacheInvalidator),
      ...(currentUser ? { currentUser } : {})
    };

    return this.updateOps.execute(operationParams);
  }

  async deleteTableRecord (params: DeleteTableOperation): Promise<WithSuccess> {
    const { category, name, id, currentUser, bypassQueue = false } = params;

    const entry = this.repositoryManager.getRepository(`${category}:${name}`);
    if (!entry) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);

    const { repository, metadata } = entry;

    const operationParams: BaseOperationParams = {
      repository,
      metadata,
      category,
      name,
      id,
      bypassQueue,
      waitForJobCompletion: this.queueHelper.waitForJobCompletion.bind(this.queueHelper),
      invalidateCache: this.cacheInvalidator.invalidateCache.bind(this.cacheInvalidator),
      ...(currentUser ? { currentUser } : {})
    };

    return this.deleteOps.execute(operationParams);
  }

  async close (): Promise<void> {
    await this.queueHelper.close();
  }
}
