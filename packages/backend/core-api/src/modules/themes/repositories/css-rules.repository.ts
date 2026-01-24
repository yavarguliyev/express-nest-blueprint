import { BaseRepository, CircuitBreaker, CrudTable, DatabaseService, Injectable, QueryAllWithPaginationOptions, DatabaseAdapter } from '@config/libs';

import { FindCssQueryDto } from '@modules/themes/dtos/find-css-audit-log.dto';
import { CssRuleEntity } from '@modules/themes/interfaces/theme.interface';

@CrudTable({ category: 'Database Management', name: 'css_rules', displayName: 'CSS Rules', actions: { create: false, update: false, delete: false } })
@Injectable()
export class CssRulesRepository extends BaseRepository<CssRuleEntity> {
  constructor (databaseService: DatabaseService) {
    super(databaseService, 'css_rules', {
      fileId: 'file_id',
      ruleOrder: 'rule_order',
      isImportant: 'is_important',
      appliesToTheme: 'applies_to_theme',
      lineNumber: 'line_number',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  protected getSelectColumns (): string[] {
    return ['id', 'fileId', 'selector', 'properties', 'ruleOrder', 'isImportant', 'appliesToTheme', 'lineNumber', 'createdAt', 'updatedAt'];
  }

  override getSearchableFields (): string[] {
    return ['selector', 'appliesToTheme'];
  }

  protected override inferColumnType (columnName: string): string {
    if (columnName === 'properties') return 'json';
    if (columnName === 'ruleOrder' || columnName === 'lineNumber') return 'number';
    return super.inferColumnType(columnName);
  }

  @CircuitBreaker({ key: 'db_postgresql' })
  async findCssRulesWithPagination (opts: FindCssQueryDto): Promise<{ cssRules: CssRuleEntity[]; total: number }> {
    const { page, limit, search, fileId, appliesToTheme, isImportant, sortBy, sortOrder } = opts;

    const where: Record<string, unknown> = {};

    if (fileId) where['fileId'] = fileId;
    if (appliesToTheme) where['appliesToTheme'] = appliesToTheme;
    if (isImportant !== undefined) where['isImportant'] = isImportant;

    const options: QueryAllWithPaginationOptions = {
      page: page ?? 1,
      limit: limit ?? 10,
      searchFields: ['selector', 'appliesToTheme'],
      orderBy: sortBy ?? 'ruleOrder',
      orderDirection: sortOrder ?? 'ASC',
      ...(Object.keys(where).length > 0 ? { where } : {}),
      ...(search ? { search } : {})
    };

    const result = await this.findAllWithPagination(options);

    return { cssRules: result.data, total: result.total };
  }

  async findByFileId (fileId: string, connection?: DatabaseAdapter): Promise<CssRuleEntity[]> {
    return this.findAll({ where: { fileId }, orderBy: 'ruleOrder', orderDirection: 'ASC' }, connection);
  }

  async findBySelector (selector: string, connection?: DatabaseAdapter): Promise<CssRuleEntity[]> {
    return this.findAll({ where: { selector } }, connection);
  }

  async findByTheme (appliesToTheme: string, connection?: DatabaseAdapter): Promise<CssRuleEntity[]> {
    return this.findAll({ where: { appliesToTheme } }, connection);
  }
}
