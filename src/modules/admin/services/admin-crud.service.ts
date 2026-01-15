import { Injectable } from '@common/decorators';
import { StorageService } from '@core/storage/storage.service';
import { TableMetadata, ColumnMetadata } from '@modules/admin/interfaces';
import { CRUD_TABLE_METADATA_KEY } from '@common/decorators';
import { UsersRepository } from '@modules/users/users.repository';
import { CrudTableOptions, RepositoryEntry } from '@common/interfaces';
import { InternalServerErrorException } from '@common/exceptions';
import { CrudRepository } from '@common/types';
import { Logger } from '@common/logger';
import { getErrorMessage } from '@common/helpers';

@Injectable()
export class AdminCrudService {
  private readonly logger = new Logger('AdminCrudService');
  private repositories = new Map<string, RepositoryEntry>();

  constructor (
    usersRepository: UsersRepository,
    private readonly storageService: StorageService
  ) {
    this.registerRepository(usersRepository, UsersRepository);
  }

  private registerRepository (repository: CrudRepository, repositoryClass: object): void {
    const metadata = Reflect.getMetadata(CRUD_TABLE_METADATA_KEY, repositoryClass) as CrudTableOptions | undefined;

    if (!metadata) return;

    const key = `${metadata.category}:${metadata.name}`;

    this.repositories.set(key, {
      repository,
      metadata
    });
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
        columns: this.getTableColumns(metadata.name)
      });
    }

    return schema;
  }

  private getTableColumns (tableName: string): ColumnMetadata[] {
    if (tableName === 'users') {
      return [
        { name: 'id', type: 'number', required: true, editable: false },
        { name: 'email', type: 'string', required: true, editable: true },
        { name: 'firstName', type: 'string', required: true, editable: true },
        { name: 'lastName', type: 'string', required: true, editable: true },
        { name: 'isActive', type: 'boolean', required: true, editable: true },
        { name: 'profileImageUrl', type: 'string', required: false, editable: true },
        { name: 'isEmailVerified', type: 'boolean', required: true, editable: true }
      ];
    }

    return [];
  }

  async getTableData (category: string, name: string, page = 1, limit = 10): Promise<{ data: unknown[]; total: number }> {
    const key = `${category}:${name}`;
    const entry = this.repositories.get(key);

    if (!entry) throw new Error(`Table ${category}:${name} not found`);

    const repo = entry.repository;

    let data: unknown[] = [];
    let total = 0;

    if (repo.findWithPagination) {
      const result = await repo.findWithPagination({ page, limit });

      data = result.data;
      total = result.total;
    } else if (repo.findAll) {
      const offset = (page - 1) * limit;

      data = await repo.findAll({ limit, offset });
      total = data.length;
    } else {
      throw new InternalServerErrorException(`Repository for ${category}:${name} does not support data retrieval`);
    }

    if (name === 'users') {
      const usersWithProfileImages = data.filter((item) => this.hasProfileImageUrl(item));
      await this.signProfileImages(usersWithProfileImages);
    }

    return { data, total };
  }

  async getTableDataByName (name: string, page = 1, limit = 10): Promise<{ data: unknown[]; total: number }> {
    let entry: RepositoryEntry | undefined;

    for (const [, e] of this.repositories) {
      if (e.metadata.name === name) {
        entry = e;
        break;
      }
    }

    if (!entry) throw new Error(`Table ${name} not found`);

    const repo = entry.repository;

    let data: unknown[] = [];
    let total = 0;

    if (repo.findWithPagination) {
      const result = await repo.findWithPagination({ page, limit });

      data = result.data;
      total = result.total;
    } else if (repo.findAll) {
      const offset = (page - 1) * limit;

      data = await repo.findAll({ limit, offset });
      total = data.length;
    } else {
      throw new Error(`Repository for ${name} does not support data retrieval`);
    }

    if (name === 'users') {
      const usersWithProfileImages = data.filter((item) => this.hasProfileImageUrl(item));
      await this.signProfileImages(usersWithProfileImages);
    }

    return { data, total };
  }

  private async signProfileImages (data: Array<{ profileImageUrl?: string }>): Promise<void> {
    await Promise.all(
      data.map(async (item) => {
        if (!item.profileImageUrl) {
          return;
        }

        try {
          item.profileImageUrl = await this.storageService.getDownloadUrl(item.profileImageUrl);
        } catch (e) {
          this.logger.warn(`Failed to sign profile images: ${getErrorMessage(e)}`);
        }
      })
    );
  }

  private hasProfileImageUrl (this: void, item: unknown): item is { profileImageUrl?: string } {
    return typeof item === 'object' && item !== null && 'profileImageUrl' in item;
  }

  async getTableRecord (category: string, name: string, id: number): Promise<unknown> {
    const key = `${category}:${name}`;
    const entry = this.repositories.get(key);
    if (!entry || !entry.repository.findById) throw new Error(`Table ${category}:${name} not found or unsupported`);
    return entry.repository.findById(id);
  }

  async createTableRecord (category: string, name: string, data: unknown): Promise<unknown> {
    const entry = this.repositories.get(`${category}:${name}`);
    if (!entry || !entry.repository.create) throw new Error(`Table ${category}:${name} not found or unsupported`);
    return entry.repository.create(data);
  }

  async updateTableRecord (category: string, name: string, id: number, data: unknown): Promise<unknown> {
    const entry = this.repositories.get(`${category}:${name}`);
    if (!entry || !entry.repository.update) throw new Error(`Table ${category}:${name} not found or unsupported`);
    return entry.repository.update(id, data);
  }

  async deleteTableRecord (category: string, name: string, id: number): Promise<boolean> {
    const entry = this.repositories.get(`${category}:${name}`);
    if (!entry || !entry.repository.delete) throw new Error(`Table ${category}:${name} not found or unsupported`);
    return entry.repository.delete(id);
  }
}
