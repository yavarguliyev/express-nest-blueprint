import { Injectable, NotFoundException, parseId, RepositoryEntry } from '@config/libs';

import { ColumnMetadata } from '@modules/admin/interfaces/admin.interface';

@Injectable()
export class ReadOperations {
  getTableColumns (repositories: Map<string, RepositoryEntry>, tableName: string): ColumnMetadata[] {
    const entry = this.findRepositoryByName(repositories, tableName);
    if (!entry || !entry.repository.getColumnMetadata) return [];
    return entry.repository.getColumnMetadata() as ColumnMetadata[];
  }

  findRepositoryByName (repositories: Map<string, RepositoryEntry>, name: string): RepositoryEntry | undefined {
    for (const [, entry] of repositories) {
      if (entry.metadata.name === name) return entry;
    }

    return undefined;
  }

  async getTableData (
    entry: RepositoryEntry | undefined,
    category: string,
    name: string,
    pageNum?: string,
    limitNum?: string,
    search?: string,
    t?: string
  ): Promise<{ data: unknown[]; total: number }> {
    const page = pageNum ? parseInt(pageNum, 10) : 1;
    const limit = limitNum ? parseInt(limitNum, 10) : 10;

    if (!entry) throw new NotFoundException(`Table ${category}:${name}${t ?? ''} not found`);
    return entry.repository.retrieveDataWithPagination!(page, limit, search);
  }

  async getTableDataByName (
    entry: RepositoryEntry | undefined,
    name: string,
    pageNum?: string,
    limitNum?: string,
    search?: string
  ): Promise<{ data: unknown[]; total: number }> {
    const page = pageNum ? parseInt(pageNum, 10) : 1;
    const limit = limitNum ? parseInt(limitNum, 10) : 10;

    if (!entry) throw new NotFoundException(`Table ${name} not found`);
    return entry.repository.retrieveDataWithPagination!(page, limit, search);
  }

  async getTableRecord (entry: RepositoryEntry | undefined, category: string, name: string, id: string | number): Promise<unknown> {
    if (!entry || !entry.repository.findById) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);
    const parsedId = parseId(id);
    return entry.repository.findById(parsedId);
  }
}
