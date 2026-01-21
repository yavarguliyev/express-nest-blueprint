import { BaseRepository, CircuitBreaker, CrudTable, DatabaseService, Injectable, QueryAllWithPaginationOptions, DatabaseAdapter } from '@config/libs';

import { FindCssQueryDto } from '@modules/themes/dtos/find-css-audit-log.dto';
import { CssFileEntity } from '@modules/themes/interfaces/theme.interface';

@CrudTable({ category: 'Database Management', name: 'css_files', displayName: 'CSS Files' })
@Injectable()
export class CssFilesRepository extends BaseRepository<CssFileEntity> {
  constructor (databaseService: DatabaseService) {
    super(databaseService, 'css_files', {
      fileName: 'file_name',
      filePath: 'file_path',
      isEmpty: 'is_empty',
      fileSize: 'file_size',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  protected getSelectColumns (): string[] {
    return ['id', 'fileName', 'filePath', 'description', 'isEmpty', 'fileSize', 'category', 'createdAt', 'updatedAt'];
  }

  override getSearchableFields (): string[] {
    return ['fileName', 'filePath', 'description', 'category'];
  }

  @CircuitBreaker({ key: 'db_postgresql' })
  async findCssFilesWithPagination (opts: FindCssQueryDto): Promise<{ cssFiles: CssFileEntity[]; total: number }> {
    const { page, limit, search, category, isEmpty, sortBy, sortOrder } = opts;

    const where: Record<string, unknown> = {};

    if (category) where['category'] = category;
    if (isEmpty !== undefined) where['isEmpty'] = isEmpty;

    const options: QueryAllWithPaginationOptions = {
      page: page ?? 1,
      limit: limit ?? 10,
      searchFields: ['fileName', 'filePath', 'description', 'category'],
      orderBy: sortBy ?? 'fileName',
      orderDirection: sortOrder ?? 'ASC',
      ...(Object.keys(where).length > 0 ? { where } : {}),
      ...(search ? { search } : {})
    };

    const result = await this.findAllWithPagination(options);

    return { cssFiles: result.data, total: result.total };
  }

  async findByFilePath (filePath: string, connection?: DatabaseAdapter): Promise<CssFileEntity | null> {
    return this.findOne({ filePath }, connection);
  }

  async findByCategory (category: string, connection?: DatabaseAdapter): Promise<CssFileEntity[]> {
    return this.findAll({ where: { category } }, connection);
  }
}
