import {
  BaseRepository,
  CircuitBreaker,
  CrudTable,
  DatabaseService,
  Injectable,
  QueryAllWithPaginationOptions,
  DatabaseAdapter,
  JwtPayload,
  ForbiddenException,
  UserRoles,
  CIRCUIT_BREAKER_KEYS
} from '@config/libs';

import { FindCssQueryDto } from '@modules/themes/dtos/find-css-audit-log.dto';
import { ThemeVersionEntity } from '@modules/themes/interfaces/theme.interface';

@CrudTable({
  category: 'Database Management',
  name: 'theme_versions',
  displayName: 'Theme Versions',
  actions: { create: false, update: false, delete: false }
})
@Injectable()
export class ThemeVersionsRepository extends BaseRepository<ThemeVersionEntity> {
  constructor (databaseService: DatabaseService) {
    super(databaseService, 'theme_versions', {
      versionName: 'version_name',
      versionNumber: 'version_number',
      isActive: 'is_active',
      tokenOverrides: 'token_overrides',
      createdBy: 'created_by',
      publishedAt: 'published_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  protected getSelectColumns (): string[] {
    return [
      'id',
      'versionName',
      'versionNumber',
      'status',
      'isActive',
      'tokenOverrides',
      'description',
      'createdBy',
      'publishedAt',
      'createdAt',
      'updatedAt'
    ];
  }

  override getSearchableFields (): string[] {
    return ['versionName', 'status', 'description'];
  }

  protected override inferColumnType (columnName: string): string {
    if (columnName === 'tokenOverrides') return 'json';
    if (columnName === 'versionNumber') return 'number';
    if (columnName === 'publishedAt') return 'datetime';
    return super.inferColumnType(columnName);
  }

  protected override isColumnEditable (columnName: string): boolean {
    const nonEditableFields = ['id', 'versionNumber', 'createdAt', 'updatedAt', 'publishedAt'];
    return !nonEditableFields.includes(columnName);
  }

  @CircuitBreaker({ key: CIRCUIT_BREAKER_KEYS.POSTGRES })
  async findThemeVersionsWithPagination (opts: FindCssQueryDto): Promise<{ themeVersions: ThemeVersionEntity[]; total: number }> {
    const { page, limit, search, status, isActive, sortBy, sortOrder } = opts;

    const where: Record<string, unknown> = {};

    if (status) where['status'] = status;
    if (isActive !== undefined) where['isActive'] = isActive;

    const options: QueryAllWithPaginationOptions = {
      page: page ?? 1,
      limit: limit ?? 10,
      searchFields: ['versionName', 'status', 'description'],
      orderBy: sortBy ?? 'versionNumber',
      orderDirection: sortOrder ?? 'DESC',
      ...(Object.keys(where).length > 0 ? { where } : {}),
      ...(search ? { search } : {})
    };

    const result = await this.findAllWithPagination(options);

    return { themeVersions: result.data, total: result.total };
  }

  async findActiveTheme (connection?: DatabaseAdapter): Promise<ThemeVersionEntity | null> {
    return this.findOne({ isActive: true }, connection);
  }

  async findByVersionNumber (versionNumber: number, connection?: DatabaseAdapter): Promise<ThemeVersionEntity | null> {
    return this.findOne({ versionNumber }, connection);
  }

  async findByStatus (status: 'draft' | 'published' | 'archived', connection?: DatabaseAdapter): Promise<ThemeVersionEntity[]> {
    return this.findAll({ where: { status } }, connection);
  }

  override async update<K extends keyof ThemeVersionEntity> (
    id: number,
    data: Partial<ThemeVersionEntity>,
    returningColumns?: K[],
    connection?: DatabaseAdapter,
    currentUser?: JwtPayload
  ): Promise<Pick<ThemeVersionEntity, K> | null> {
    if (currentUser && currentUser.role !== UserRoles.GLOBAL_ADMIN && currentUser.role !== UserRoles.ADMIN) {
      throw new ForbiddenException('Only administrators can update theme versions');
    }

    if (data.isActive === true) {
      const db = connection || this.databaseService.getWriteConnection();
      await db.query('UPDATE theme_versions SET is_active = false WHERE is_active = true', []);
    }

    if (data.status === 'published' && !data.publishedAt) data.publishedAt = new Date();

    return super.update(id, data, returningColumns, connection, currentUser);
  }

  override async delete (id: number, connection?: DatabaseAdapter, currentUser?: JwtPayload): Promise<boolean> {
    if (currentUser && currentUser.role !== UserRoles.GLOBAL_ADMIN)
      throw new ForbiddenException('Only Global Administrators can delete theme versions');
    const theme = await this.findById(id, connection);
    if (theme?.isActive) throw new ForbiddenException('Cannot delete the active theme version');
    return super.delete(id, connection, currentUser);
  }
}
