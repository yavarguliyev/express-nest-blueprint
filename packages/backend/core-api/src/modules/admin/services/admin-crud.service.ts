import {
  CRUD_TABLE_METADATA_KEY,
  CrudRepository,
  CrudTableOptions,
  Injectable,
  InternalServerErrorException,
  RepositoryEntry,
  StorageService,
  JwtPayload,
  ForbiddenException,
  NotFoundException,
  convertValueToSearchableString,
  FindUsersWithPagination
} from '@config/libs';

import { TableMetadata, ColumnMetadata } from '@modules/admin/interfaces/admin.interface';
import { UsersRepository } from '@modules/users/users.repository';

@Injectable()
export class AdminCrudService {
  private repositories = new Map<string, RepositoryEntry>();

  constructor (
    usersRepository: UsersRepository,
    private readonly storageService: StorageService
  ) {
    this.registerRepository(usersRepository, UsersRepository);
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

  async getTableData (category: string, name: string, pageNum?: string, limitNum?: string, search?: string): Promise<{ data: unknown[]; total: number }> {
    const page = pageNum ? parseInt(pageNum, 10) : 1;
    const limit = limitNum ? parseInt(limitNum, 10) : 10;
    const key = `${category}:${name}`;
    const entry = this.repositories.get(key);

    if (!entry) throw new NotFoundException(`Table ${category}:${name} not found`);

    const repo = entry.repository;

    let data: unknown[] = [];
    let total = 0;

    if (name === 'users' && 'findUsersWithPagination' in repo) {
      const usersRepo = repo as FindUsersWithPagination;
      const searchTerm = search?.trim();
      const result = await usersRepo.findUsersWithPagination({ page, limit, ...(searchTerm ? { search: searchTerm } : {}) });

      data = result.users;
      total = result.total;
    } else if (repo.findWithPagination) {
      const result = await repo.findWithPagination({ page, limit });

      data = result.data;
      total = result.total;

      if (search && search.trim()) {
        data = this.applySearch(data, search.trim(), name);
        total = data.length;

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        data = data.slice(startIndex, endIndex);
      }
    } else if (repo.findAll) {
      const offset = (page - 1) * limit;

      data = await repo.findAll({ limit, offset });
      total = data.length;

      if (search && search.trim()) {
        data = this.applySearch(data, search.trim(), name);
        total = data.length;

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        data = data.slice(startIndex, endIndex);
      }
    } else throw new InternalServerErrorException(`Repository for ${category}:${name} does not support data retrieval`);

    if (name === 'users') await this.signProfileImages(data.filter((item) => this.hasProfileImageUrl(item)));

    return { data, total };
  }

  async getTableDataByName (name: string, pageNum?: string, limitNum?: string, search?: string): Promise<{ data: unknown[]; total: number }> {
    const page = pageNum ? parseInt(pageNum, 10) : 1;
    const limit = limitNum ? parseInt(limitNum, 10) : 10;

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

    // Use database-level search for users table
    if (name === 'users' && 'findUsersWithPagination' in repo) {
      const usersRepo = repo as { findUsersWithPagination: (opts: { page: number; limit: number; search?: string }) => Promise<{ users: unknown[]; total: number }> };
      const searchTerm = search?.trim();
      const result = await usersRepo.findUsersWithPagination({
        page,
        limit,
        ...(searchTerm ? { search: searchTerm } : {})
      });

      data = result.users;
      total = result.total;
    } else if (repo.findWithPagination) {
      const result = await repo.findWithPagination({ page, limit });

      data = result.data;
      total = result.total;

      // Apply application-level search for non-users tables
      if (search && search.trim()) {
        data = this.applySearch(data, search.trim(), name);
        total = data.length;

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        data = data.slice(startIndex, endIndex);
      }
    } else if (repo.findAll) {
      const offset = (page - 1) * limit;

      data = await repo.findAll({ limit, offset });
      total = data.length;

      // Apply application-level search for repositories without pagination
      if (search && search.trim()) {
        data = this.applySearch(data, search.trim(), name);
        total = data.length;

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        data = data.slice(startIndex, endIndex);
      }
    } else throw new NotFoundException(`Repository for ${name} does not support data retrieval`);

    if (name === 'users') await this.signProfileImages(data.filter((item) => this.hasProfileImageUrl(item)));

    return { data, total };
  }

  async getTableRecord (category: string, name: string, id: number): Promise<unknown> {
    const key = `${category}:${name}`;
    const entry = this.repositories.get(key);
    if (!entry || !entry.repository.findById) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);
    return entry.repository.findById(id);
  }

  async createTableRecord (category: string, name: string, data: unknown): Promise<unknown> {
    const entry = this.repositories.get(`${category}:${name}`);
    if (!entry || !entry.repository.create) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);
    return entry.repository.create(data);
  }

  async updateTableRecord (category: string, name: string, id: number, data: Record<string, unknown>, currentUser?: JwtPayload): Promise<unknown> {
    if (name === 'users') {
      if (!currentUser) throw new InternalServerErrorException('Security Context Missing: Unable to verify user permissions');

      if (currentUser.sub === id) {
        const restrictedFields = ['isactive', 'is_active', 'isemailverified', 'is_email_verified'];
        const fields = Object.keys(data).map((f) => f.toLowerCase());
        const hasRestrictedField = fields.some((f) => restrictedFields.includes(f));
        if (hasRestrictedField) throw new ForbiddenException('You are not allowed to update sensitive fields on your own account');
      }
    }

    const entry = this.repositories.get(`${category}:${name}`);
    if (!entry || !entry.repository.update) throw new Error(`Table ${category}:${name} not found or unsupported`);
    return entry.repository.update(id, data);
  }

  async deleteTableRecord (category: string, name: string, id: number, currentUser?: JwtPayload): Promise<{ success: boolean }> {
    if (name === 'users') {
      if (!currentUser) throw new InternalServerErrorException('Security Context Missing: Unable to verify user permissions');
      if (currentUser.sub === id) throw new ForbiddenException('You cannot delete your own account');
    }

    const entry = this.repositories.get(`${category}:${name}`);
    if (!entry || !entry.repository.delete) throw new Error(`Table ${category}:${name} not found or unsupported`);
    const success = await entry.repository.delete(id);

    return { success };
  }

  private registerRepository (repository: CrudRepository, repositoryClass: object): void {
    const metadata = Reflect.getMetadata(CRUD_TABLE_METADATA_KEY, repositoryClass) as CrudTableOptions | undefined;
    if (!metadata) return;
    const key = `${metadata.category}:${metadata.name}`;
    this.repositories.set(key, { repository, metadata });
  }

  private getTableColumns (tableName: string): ColumnMetadata[] {
    if (tableName === 'users') {
      return [
        { name: 'id', type: 'number', required: true, editable: false },
        { name: 'email', type: 'string', required: true, editable: true },
        { name: 'firstName', type: 'string', required: true, editable: true },
        { name: 'lastName', type: 'string', required: true, editable: true },
        { name: 'role', type: 'string', required: true, editable: true },
        { name: 'isActive', type: 'boolean', required: true, editable: true },
        { name: 'profileImageUrl', type: 'string', required: false, editable: true },
        { name: 'isEmailVerified', type: 'boolean', required: true, editable: true },
        { name: 'createdAt', type: 'datetime', required: true, editable: false },
        { name: 'updatedAt', type: 'datetime', required: true, editable: false },
        { name: 'lastLogin', type: 'datetime', required: false, editable: false }
      ];
    }

    return [];
  }

  private async signProfileImages (data: Array<{ profileImageUrl?: string }>): Promise<void> {
    await Promise.all(
      data.map(async (item) => {
        if (!item.profileImageUrl) return;
        item.profileImageUrl = await this.storageService.getDownloadUrl(item.profileImageUrl);
      })
    );
  }

  private hasProfileImageUrl (this: void, item: unknown): item is { profileImageUrl?: string } {
    return typeof item === 'object' && item !== null && 'profileImageUrl' in item;
  }

  private applySearch (data: unknown[], searchTerm: string, tableName: string): unknown[] {
    if (!searchTerm || !data.length) return data;

    const lowerSearchTerm = searchTerm.toLowerCase();

    return data.filter((record) => {
      if (!record || typeof record !== 'object') return false;

      const searchableFields = this.getSearchableFields(record as Record<string, unknown>, tableName);
      return searchableFields.some((field) => {
        const value = (record as Record<string, unknown>)[field];
        if (value === null || value === undefined) return false;
        return convertValueToSearchableString(value).toLowerCase().includes(lowerSearchTerm);
      });
    });
  }

  private getSearchableFields (record: Record<string, unknown>, tableName: string): string[] {
    const allFields = Object.keys(record);
    const excludeFields = ['id', 'password', 'passwordHash', 'password_hash', 'createdAt', 'updatedAt', 'created_at', 'updated_at'];
    const tableSearchFields: Record<string, string[]> = { users: ['email', 'firstName', 'lastName', 'first_name', 'last_name', 'role'] };

    if (tableSearchFields[tableName]) return tableSearchFields[tableName].filter((field) => allFields.includes(field));
    return allFields.filter((field) => !excludeFields.includes(field));
  }
}
