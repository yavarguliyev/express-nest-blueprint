import { BaseRepository, CircuitBreaker, CrudTable, DatabaseService, Injectable, QueryAllWithPaginationOptions, DatabaseAdapter } from '@config/libs';

import { FindCssQueryDto } from '@modules/themes/dtos/find-css-audit-log.dto';
import { CssTokenEntity } from '@modules/themes/interfaces/theme.interface';

@CrudTable({ category: 'Database Management', name: 'css_tokens', displayName: 'CSS Tokens', actions: { create: false, update: false, delete: false } })
@Injectable()
export class CssTokensRepository extends BaseRepository<CssTokenEntity> {
  constructor (databaseService: DatabaseService) {
    super(databaseService, 'css_tokens', {
      tokenName: 'token_name',
      tokenCategory: 'token_category',
      tokenType: 'token_type',
      defaultValue: 'default_value',
      lightModeValue: 'light_mode_value',
      darkModeValue: 'dark_mode_value',
      isCustomizable: 'is_customizable',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  protected getSelectColumns (): string[] {
    return ['id', 'tokenName', 'tokenCategory', 'tokenType', 'defaultValue', 'lightModeValue', 'darkModeValue', 'description', 'isCustomizable', 'createdAt', 'updatedAt'];
  }

  override getSearchableFields (): string[] {
    return ['tokenName', 'tokenCategory', 'tokenType', 'description'];
  }

  @CircuitBreaker({ key: 'db_postgresql' })
  async findCssTokensWithPagination (opts: FindCssQueryDto): Promise<{ cssTokens: CssTokenEntity[]; total: number }> {
    const { page, limit, search, tokenCategory, tokenType, isCustomizable, sortBy, sortOrder } = opts;

    const where: Record<string, unknown> = {};

    if (tokenCategory) where['tokenCategory'] = tokenCategory;
    if (tokenType) where['tokenType'] = tokenType;
    if (isCustomizable !== undefined) where['isCustomizable'] = isCustomizable;

    const options: QueryAllWithPaginationOptions = {
      page: page ?? 1,
      limit: limit ?? 10,
      searchFields: ['tokenName', 'tokenCategory', 'tokenType', 'description'],
      orderBy: sortBy ?? 'tokenName',
      orderDirection: sortOrder ?? 'ASC',
      ...(Object.keys(where).length > 0 ? { where } : {}),
      ...(search ? { search } : {})
    };

    const result = await this.findAllWithPagination(options);

    return { cssTokens: result.data, total: result.total };
  }

  async findByTokenName (tokenName: string, connection?: DatabaseAdapter): Promise<CssTokenEntity | null> {
    return this.findOne({ tokenName }, connection);
  }

  async findByCategory (tokenCategory: string, connection?: DatabaseAdapter): Promise<CssTokenEntity[]> {
    return this.findAll({ where: { tokenCategory } }, connection);
  }

  async findByType (tokenType: string, connection?: DatabaseAdapter): Promise<CssTokenEntity[]> {
    return this.findAll({ where: { tokenType } }, connection);
  }
}
