import { DatabaseAdapter } from '../../../domain/interfaces/database/database.interface';
import { QueryPaginationOptionsResults, QueryWithPaginationOptions } from '../../../domain/interfaces/database/query-builder.interface';
import { NotFoundException } from '../../../domain/exceptions/http-exceptions';
import { convertValueToSearchableString } from '../../../domain/helpers/utility-functions.helper';

export class QueryMethods<T> {
  isColumnRequired = (columnName: string): boolean => !['profileImageUrl', 'lastLogin'].includes(columnName);
  isColumnEditable = (columnName: string): boolean => !['id', 'createdAt', 'updatedAt', 'lastLogin'].includes(columnName);

  applySearch (data: unknown[], searchTerm: string, getSearchableFields: () => string[]): unknown[] {
    if (!searchTerm || !data.length) return data;

    const lowerSearchTerm = searchTerm.toLowerCase();
    const searchableFields = getSearchableFields();

    return data.filter(record => {
      if (!record || typeof record !== 'object') return false;

      return searchableFields.some(field => {
        const value = (record as Record<string, unknown>)[field];
        if (value === null || value === undefined) return false;
        return convertValueToSearchableString(value).toLowerCase().includes(lowerSearchTerm);
      });
    });
  }

  paginateArray (data: unknown[], page: number, limit: number): unknown[] {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return data.slice(startIndex, endIndex);
  }

  getSearchableFields (allFields: string[]): string[] {
    const excludeFields = ['id', 'password', 'passwordHash', 'password_hash', 'createdAt', 'updatedAt', 'created_at', 'updated_at'];
    return allFields.filter(field => !excludeFields.includes(field));
  }

  getColumnMetadata (
    getSelectColumns: () => string[],
    inferColumnType: (columnName: string) => string,
    isColumnRequired: (columnName: string) => boolean,
    isColumnEditable: (columnName: string) => boolean
  ): Array<{ name: string; type: string; required: boolean; editable: boolean }> {
    const columns = getSelectColumns();
    return columns.map(columnName => ({
      name: columnName,
      type: inferColumnType(columnName),
      required: isColumnRequired(columnName),
      editable: isColumnEditable(columnName)
    }));
  }

  inferColumnType (columnName: string): string {
    if (columnName === 'id') return 'number';
    if (columnName.includes('Date') || columnName.includes('At')) return 'datetime';
    if (columnName.startsWith('is') || columnName.includes('Active') || columnName.includes('Verified')) return 'boolean';
    return 'string';
  }

  async retrieveDataWithPagination (
    page: number,
    limit: number,
    search: string | undefined,
    findWithPagination:
      | ((
          options: QueryWithPaginationOptions & { page: number; limit: number },
          connection?: DatabaseAdapter
        ) => Promise<QueryPaginationOptionsResults<T>>)
      | undefined,
    findAll: ((options?: QueryWithPaginationOptions, connection?: DatabaseAdapter) => Promise<T[]>) | undefined,
    applyPostProcessing: (data: unknown[]) => Promise<void>,
    getSearchableFields: () => string[]
  ): Promise<{ data: unknown[]; total: number }> {
    let data: unknown[] = [];
    let total = 0;

    if (findWithPagination) {
      const result = await findWithPagination({ page, limit });

      data = result.data;
      total = result.total;

      if (search && search.trim()) {
        data = this.applySearch(data, search.trim(), getSearchableFields);
        total = data.length;
        data = this.paginateArray(data, page, limit);
      }
    } else if (findAll) {
      const offset = (page - 1) * limit;

      data = await findAll({ limit, offset });
      total = data.length;

      if (search && search.trim()) {
        data = this.applySearch(data, search.trim(), getSearchableFields);
        total = data.length;
        data = this.paginateArray(data, page, limit);
      }
    } else throw new NotFoundException('Repository does not support data retrieval');

    await applyPostProcessing(data);

    return { data, total };
  }
}
