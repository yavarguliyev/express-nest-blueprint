import { Injectable, JwtPayload, NotFoundException } from '@config/libs';

import { TableMetadata } from '@modules/admin/interfaces/admin.interface';
import { CreateOperations } from './crud-operations/create-operations';
import { ReadOperations } from './crud-operations/read-operations';
import { UpdateOperations } from './crud-operations/update-operations';
import { DeleteOperations } from './crud-operations/delete-operations';
import { RepositoryManager } from './crud-operations/repository-manager';
import { RepositoryRegistrar } from './crud-operations/repository-registrar';
import { QueueManagerHelper } from './crud-operations/queue-manager-helper';
import { SchemaBuilder } from './crud-operations/schema-builder';
import { CacheInvalidator } from './crud-operations/cache-invalidator';

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

  async getTableData (
    category: string,
    name: string,
    pageNum?: string,
    limitNum?: string,
    search?: string,
    t?: string
  ): Promise<{ data: unknown[]; total: number }> {
    const key = `${category}:${name}`;
    const entry = this.repositoryManager.getRepository(key);
    return this.readOps.getTableData(entry, category, name, pageNum, limitNum, search, t);
  }

  async getTableDataByName (name: string, pageNum?: string, limitNum?: string, search?: string): Promise<{ data: unknown[]; total: number }> {
    const entry = this.readOps.findRepositoryByName(this.repositoryManager.getAllRepositories(), name);
    return this.readOps.getTableDataByName(entry, name, pageNum, limitNum, search);
  }

  async getTableRecord (category: string, name: string, id: string | number): Promise<unknown> {
    const key = `${category}:${name}`;
    const entry = this.repositoryManager.getRepository(key);
    return this.readOps.getTableRecord(entry, category, name, id);
  }

  async createTableRecord (category: string, name: string, data: unknown, currentUser?: JwtPayload, bypassQueue = false): Promise<unknown> {
    const entry = this.repositoryManager.getRepository(`${category}:${name}`);
    if (!entry) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);

    return this.createOps.execute(
      entry.repository,
      entry.metadata,
      category,
      name,
      data,
      currentUser,
      bypassQueue,
      (queueName, job) => this.queueHelper.waitForJobCompletion(queueName, job),
      (metadata, id) => this.cacheInvalidator.invalidateCache(metadata, id)
    );
  }

  async updateTableRecord (
    category: string,
    name: string,
    id: string | number,
    data: Record<string, unknown>,
    currentUser?: JwtPayload,
    bypassQueue = false
  ): Promise<unknown> {
    const entry = this.repositoryManager.getRepository(`${category}:${name}`);
    if (!entry) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);

    return this.updateOps.execute(
      entry.repository,
      entry.metadata,
      category,
      name,
      id,
      data,
      currentUser,
      bypassQueue,
      (queueName, job) => this.queueHelper.waitForJobCompletion(queueName, job),
      (metadata, recordId) => this.cacheInvalidator.invalidateCache(metadata, recordId)
    );
  }

  async deleteTableRecord (
    category: string,
    name: string,
    id: string | number,
    currentUser?: JwtPayload,
    bypassQueue = false
  ): Promise<{ success: boolean }> {
    const entry = this.repositoryManager.getRepository(`${category}:${name}`);
    if (!entry) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);

    return this.deleteOps.execute(
      entry.repository,
      entry.metadata,
      category,
      name,
      id,
      currentUser,
      bypassQueue,
      (queueName, job) => this.queueHelper.waitForJobCompletion(queueName, job),
      (metadata, recordId) => this.cacheInvalidator.invalidateCache(metadata, recordId)
    );
  }

  async close (): Promise<void> {
    await this.queueHelper.close();
  }
}
