import {
  CircuitBreaker,
  CrudTable,
  Injectable,
  QueryAllWithPaginationOptions,
  CIRCUIT_BREAKER_KEYS,
  BaseRepository,
  DatabaseService
} from '@config/libs';

import { TokenUsageEntity } from '@modules/themes/interfaces/theme.interface';
import { FindCssQueryDto } from '@modules/themes/dtos/find-css-audit-log.dto';
import { PropertyNameParams, RuleIdParams, TokenIdParams, TokenUsageByRuleParams } from '@modules/themes/types/theme.type';

@CrudTable({
  category: 'Database Management',
  name: 'token_usage',
  displayName: 'Token Usage',
  actions: { create: false, update: false, delete: false }
})
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

  @CircuitBreaker({ key: CIRCUIT_BREAKER_KEYS.POSTGRES })
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

  async findByTokenId (params: TokenIdParams): Promise<TokenUsageEntity[]> {
    const { tokenId, connection } = params;
    return this.findAll({ where: { tokenId } }, connection);
  }

  async findByRuleId (params: RuleIdParams): Promise<TokenUsageEntity[]> {
    const { ruleId, connection } = params;
    return this.findAll({ where: { ruleId } }, connection);
  }

  async findByProperty (params: PropertyNameParams): Promise<TokenUsageEntity[]> {
    const { propertyName, connection } = params;
    return this.findAll({ where: { propertyName } }, connection);
  }

  async findUsageByTokenAndRule (params: TokenUsageByRuleParams): Promise<TokenUsageEntity | null> {
    const { tokenId, ruleId, propertyName, connection } = params;
    return this.findOne({ tokenId, ruleId, propertyName }, connection);
  }
}
