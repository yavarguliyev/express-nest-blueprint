import { CRUD_TABLE_METADATA_KEY, CrudRepository, CrudTableOptions, Injectable, RepositoryEntry, JwtPayload, NotFoundException, BaseRepository, parseId, NotificationsRepository } from '@config/libs';

import { TableMetadata, ColumnMetadata } from '@modules/admin/interfaces/admin.interface';
import { UsersRepository } from '@modules/users/users.repository';
import { CssFilesRepository } from '@modules/themes/repositories/css-files.repository';
import { CssTokensRepository } from '@modules/themes/repositories/css-tokens.repository';
import { CssRulesRepository } from '@modules/themes/repositories/css-rules.repository';
import { ThemeVersionsRepository } from '@modules/themes/repositories/theme-versions.repository';
import { TokenUsageRepository } from '@modules/themes/repositories/token-usage.repository';
import { CssGradientsRepository } from '@modules/themes/repositories/css-gradients.repository';
import { CssBackupsRepository } from '@modules/themes/repositories/css-backups.repository';
import { CssAuditLogRepository } from '@modules/themes/repositories/css-audit-log.repository';

@Injectable()
export class AdminCrudService {
  private repositories = new Map<string, RepositoryEntry>();

  constructor (
    usersRepository: UsersRepository,
    cssFilesRepository: CssFilesRepository,
    cssTokensRepository: CssTokensRepository,
    cssRulesRepository: CssRulesRepository,
    themeVersionsRepository: ThemeVersionsRepository,
    tokenUsageRepository: TokenUsageRepository,
    cssGradientsRepository: CssGradientsRepository,
    cssBackupsRepository: CssBackupsRepository,
    cssAuditLogRepository: CssAuditLogRepository,
    notificationsRepository: NotificationsRepository
  ) {
    this.registerRepository(usersRepository, UsersRepository);
    this.registerRepository(cssFilesRepository, CssFilesRepository);
    this.registerRepository(cssTokensRepository, CssTokensRepository);
    this.registerRepository(cssRulesRepository, CssRulesRepository);
    this.registerRepository(themeVersionsRepository, ThemeVersionsRepository);
    this.registerRepository(tokenUsageRepository, TokenUsageRepository);
    this.registerRepository(cssGradientsRepository, CssGradientsRepository);
    this.registerRepository(cssBackupsRepository, CssBackupsRepository);
    this.registerRepository(cssAuditLogRepository, CssAuditLogRepository);
    this.registerRepository(notificationsRepository, NotificationsRepository);
  }

  getTableSchema (): Record<string, TableMetadata[]> {
    const schema: Record<string, TableMetadata[]> = {};

    for (const [, { metadata }] of this.repositories) {
      if (!schema[metadata.category]) schema[metadata.category] = [];

      schema[metadata.category]?.push({
        category: metadata.category,
        name: metadata.name,
        displayName: metadata.displayName || metadata.name,
        tableName: metadata.name,
        columns: this.getTableColumns(metadata.name),
        actions: metadata.actions || { create: true, update: true, delete: true }
      });
    }

    return schema;
  }

  async getTableData (category: string, name: string, pageNum?: string, limitNum?: string, search?: string): Promise<{ data: unknown[]; total: number }> {
    const page = pageNum ? parseInt(pageNum, 10) : 1;
    const limit = limitNum ? parseInt(limitNum, 10) : 10;
    const key = `${category}:${name}`;
    const entry = this.repositories.get(key);
    if (!entry) throw new NotFoundException(`Table ${category}:${name} not found`);
    return entry.repository.retrieveDataWithPagination!(page, limit, search);
  }

  async getTableDataByName (name: string, pageNum?: string, limitNum?: string, search?: string): Promise<{ data: unknown[]; total: number }> {
    const page = pageNum ? parseInt(pageNum, 10) : 1;
    const limit = limitNum ? parseInt(limitNum, 10) : 10;
    const entry = this.findRepositoryByName(name);
    if (!entry) throw new NotFoundException(`Table ${name} not found`);
    return entry.repository.retrieveDataWithPagination!(page, limit, search);
  }

  async getTableRecord (category: string, name: string, id: string | number): Promise<unknown> {
    const key = `${category}:${name}`;
    const entry = this.repositories.get(key);
    if (!entry || !entry.repository.findById) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);
    const parsedId = parseId(id);
    return entry.repository.findById(parsedId);
  }

  async createTableRecord (category: string, name: string, data: unknown): Promise<unknown> {
    const entry = this.repositories.get(`${category}:${name}`);
    if (!entry || !entry.repository.create) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);
    return entry.repository.create(data);
  }

  async updateTableRecord (category: string, name: string, id: string | number, data: Record<string, unknown>, currentUser?: JwtPayload): Promise<unknown> {
    const entry = this.repositories.get(`${category}:${name}`);
    if (!entry || !entry.repository.update) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);
    const repository = entry.repository as BaseRepository<unknown>;
    const parsedId = parseId(id);
    return repository.update(parsedId, data, undefined, undefined, currentUser);
  }

  async deleteTableRecord (category: string, name: string, id: string | number, currentUser?: JwtPayload): Promise<{ success: boolean }> {
    const entry = this.repositories.get(`${category}:${name}`);
    if (!entry || !entry.repository.delete) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);
    const repository = entry.repository as BaseRepository<unknown>;
    const parsedId = parseId(id);
    const success = await repository.delete(parsedId, undefined, currentUser);
    return { success };
  }

  private registerRepository (repository: CrudRepository, repositoryClass: object): void {
    const metadata = Reflect.getMetadata(CRUD_TABLE_METADATA_KEY, repositoryClass) as CrudTableOptions | undefined;
    if (!metadata) return;
    const key = `${metadata.category}:${metadata.name}`;
    this.repositories.set(key, { repository, metadata });
  }

  private findRepositoryByName (name: string): RepositoryEntry | undefined {
    for (const [, entry] of this.repositories) {
      if (entry.metadata.name === name) return entry;
    }

    return undefined;
  }

  private getTableColumns (tableName: string): ColumnMetadata[] {
    const entry = this.findRepositoryByName(tableName);
    if (!entry || !entry.repository.getColumnMetadata) return [];
    return entry.repository.getColumnMetadata();
  }
}
