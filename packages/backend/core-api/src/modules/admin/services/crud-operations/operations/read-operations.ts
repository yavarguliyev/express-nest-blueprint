import { Injectable, NotFoundException, parseId, RepositoryEntry, TableDataResult } from '@config/libs';

import { ColumnMetadata, TableDataByNameOperationParams, TableDataParams, TableRecordParams } from '@modules/admin/interfaces/admin.interface';

@Injectable()
export class ReadOperations {
  getTableColumns (repositories: Map<string, RepositoryEntry>, tableName: string): ColumnMetadata[] {
    const entry = this.findRepositoryByName(repositories, tableName);
    if (!entry || !entry.repository.getColumnMetadata) return [];
    return entry.repository.getColumnMetadata();
  }

  findRepositoryByName (repositories: Map<string, RepositoryEntry>, name: string): RepositoryEntry | undefined {
    for (const [, entry] of repositories) {
      if (entry.metadata.name === name) return entry;
    }

    return undefined;
  }

  async getTableData (params: TableDataParams): Promise<TableDataResult> {
    const { entry, category, name, pageNum, limitNum, search, t } = params;

    const page = pageNum ? parseInt(pageNum, 10) : 1;
    const limit = limitNum ? parseInt(limitNum, 10) : 10;

    if (!entry || !entry.repository.retrieveDataWithPagination) throw new NotFoundException(`Table ${category}:${name}${t ?? ''} not found`);
    return entry.repository.retrieveDataWithPagination(page, limit, search);
  }

  async getTableDataByName (params: TableDataByNameOperationParams): Promise<TableDataResult> {
    const { entry, name, pageNum, limitNum, search } = params;

    const page = pageNum ? parseInt(pageNum, 10) : 1;
    const limit = limitNum ? parseInt(limitNum, 10) : 10;

    if (!entry || !entry.repository.retrieveDataWithPagination) throw new NotFoundException(`Table ${name} not found`);
    return entry.repository.retrieveDataWithPagination(page, limit, search);
  }

  async getTableRecord (params: TableRecordParams): Promise<unknown> {
    const { entry, category, name, id } = params;

    if (!entry || !entry.repository.findById) throw new NotFoundException(`Table ${category}:${name} not found or unsupported`);
    return entry.repository.findById(parseId(id));
  }
}
