import { BaseRepository, CircuitBreaker, CrudTable, DatabaseService, Injectable, QueryAllWithPaginationOptions, DatabaseAdapter, CIRCUIT_BREAKER_KEYS } from '@config/libs';

import { FindCssQueryDto } from '@modules/themes/dtos/find-css-audit-log.dto';
import { CssGradientEntity } from '@modules/themes/interfaces/theme.interface';
import { CssGradientType } from '@modules/themes/types/theme.type';

@CrudTable({
  category: 'Database Management',
  name: 'css_gradients',
  displayName: 'CSS Gradients',
  actions: { create: false, update: false, delete: false }
})
@Injectable()
export class CssGradientsRepository extends BaseRepository<CssGradientEntity> {
  constructor (databaseService: DatabaseService) {
    super(databaseService, 'css_gradients', {
      gradientName: 'gradient_name',
      gradientValue: 'gradient_value',
      gradientType: 'gradient_type',
      isSystemGradient: 'is_system_gradient',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  protected getSelectColumns (): string[] {
    return ['id', 'gradientName', 'gradientValue', 'gradientType', 'description', 'isSystemGradient', 'createdAt', 'updatedAt'];
  }

  override getSearchableFields (): string[] {
    return ['gradientName', 'gradientType', 'description'];
  }

  @CircuitBreaker({ key: CIRCUIT_BREAKER_KEYS.POSTGRES })
  async findCssGradientsWithPagination (opts: FindCssQueryDto): Promise<{ cssGradients: CssGradientEntity[]; total: number }> {
    const { page, limit, search, gradientType, isSystemGradient, sortBy, sortOrder } = opts;

    const where: Record<string, unknown> = {};

    if (gradientType) where['gradientType'] = gradientType;
    if (isSystemGradient !== undefined) where['isSystemGradient'] = isSystemGradient;

    const options: QueryAllWithPaginationOptions = {
      page: page ?? 1,
      limit: limit ?? 10,
      searchFields: ['gradientName', 'gradientType', 'description'],
      orderBy: sortBy ?? 'gradientName',
      orderDirection: sortOrder ?? 'ASC',
      ...(Object.keys(where).length > 0 ? { where } : {}),
      ...(search ? { search } : {})
    };

    const result = await this.findAllWithPagination(options);

    return { cssGradients: result.data, total: result.total };
  }

  async findByGradientName (gradientName: string, connection?: DatabaseAdapter): Promise<CssGradientEntity | null> {
    return this.findOne({ gradientName }, connection);
  }

  async findByType (gradientType: CssGradientType, connection?: DatabaseAdapter): Promise<CssGradientEntity[]> {
    return this.findAll({ where: { gradientType } }, connection);
  }

  async findSystemGradients (connection?: DatabaseAdapter): Promise<CssGradientEntity[]> {
    return this.findAll({ where: { isSystemGradient: true } }, connection);
  }

  async findCustomGradients (connection?: DatabaseAdapter): Promise<CssGradientEntity[]> {
    return this.findAll({ where: { isSystemGradient: false } }, connection);
  }
}
