import { BaseRepository, CircuitBreaker, CrudTable, DatabaseService, Injectable, QueryAllWithPaginationOptions, DatabaseAdapter } from '@config/libs';

import { TokenUsageEntity } from '@modules/themes/interfaces/theme.interface';
import { FindCssQueryDto } from '@modules/themes/dtos/find-css-audit-log.dto';

@CrudTable({ category: 'Database Management', name: 'token_usage', displayName: 'Token Usage' })
@Injectable()
export class TokenUsageRepository extends BaseRepository<TokenUsageEntity> {
  constructor (databaseService: DatabaseService) {
    super(databaseService, 'token_usage', {
      tokenId: 'token_id',
      ruleId: 'rule_id',
      propertyName: 'property_name',
      usageContext: 'usage_context',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  protected getSelectColumns (): string[] {
    return ['id', 'tokenId', 'ruleId', 'propertyName', 'usageContext', 'createdAt', 'updatedAt'];
  }

  override getSearchableFields (): string[] {
    return ['propertyName', 'usageContext'];
  }

  @CircuitBreaker({ key: 'db_postgresql' })
  async findTokenUsageWithPagination (opts: FindCssQueryDto): Promise<{ tokenUsage: TokenUsageEntity[]; total: number }> {
    const { page, limit, search, tokenId, ruleId, propertyName, sortBy, sortOrder } = opts;

    const where: Record<string, unknown> = {};

    if (tokenId) where['tokenId'] = tokenId;
    if (ruleId) where['ruleId'] = ruleId;
    if (propertyName) where['propertyName'] = propertyName;

    const options: QueryAllWithPaginationOptions = {
      page: page ?? 1,
      limit: limit ?? 10,
      searchFields: ['propertyName', 'usageContext'],
      orderBy: sortBy ?? 'propertyName',
      orderDirection: sortOrder ?? 'ASC',
      ...(Object.keys(where).length > 0 ? { where } : {}),
      ...(search ? { search } : {})
    };

    const result = await this.findAllWithPagination(options);

    return { tokenUsage: result.data, total: result.total };
  }

  async findByTokenId (tokenId: string, connection?: DatabaseAdapter): Promise<TokenUsageEntity[]> {
    return this.findAll({ where: { tokenId } }, connection);
  }

  async findByRuleId (ruleId: string, connection?: DatabaseAdapter): Promise<TokenUsageEntity[]> {
    return this.findAll({ where: { ruleId } }, connection);
  }

  async findByProperty (propertyName: string, connection?: DatabaseAdapter): Promise<TokenUsageEntity[]> {
    return this.findAll({ where: { propertyName } }, connection);
  }

  async findUsageByTokenAndRule (tokenId: string, ruleId: string, propertyName: string, connection?: DatabaseAdapter): Promise<TokenUsageEntity | null> {
    return this.findOne({ tokenId, ruleId, propertyName }, connection);
  }
}
