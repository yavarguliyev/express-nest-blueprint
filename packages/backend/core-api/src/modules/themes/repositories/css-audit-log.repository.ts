import { BaseRepository, CircuitBreaker, CrudTable, DatabaseService, Injectable, QueryAllWithPaginationOptions, DatabaseAdapter } from '@config/libs';

import { FindCssQueryDto } from '@modules/themes/dtos/find-css-audit-log.dto';
import { CssAuditLogEntity } from '@modules/themes/interfaces/theme.interface';
import { CssEntityType } from '@modules/themes/types/theme.type';

@CrudTable({ category: 'Database Management', name: 'css_audit_log', displayName: 'CSS Audit Log' })
@Injectable()
export class CssAuditLogRepository extends BaseRepository<CssAuditLogEntity> {
  constructor (databaseService: DatabaseService) {
    super(databaseService, 'css_audit_log', {
      entityType: 'entity_type',
      entityId: 'entity_id',
      oldValue: 'old_value',
      newValue: 'new_value',
      changedBy: 'changed_by',
      changeReason: 'change_reason',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  protected getSelectColumns (): string[] {
    return ['id', 'entityType', 'entityId', 'action', 'oldValue', 'newValue', 'changedBy', 'changeReason', 'createdAt', 'updatedAt'];
  }

  override getSearchableFields (): string[] {
    return ['entityType', 'action', 'changeReason'];
  }

  protected override inferColumnType (columnName: string): string {
    if (columnName === 'oldValue' || columnName === 'newValue') return 'json';
    return super.inferColumnType(columnName);
  }

  protected override isColumnEditable (columnName: string): boolean {
    return ['changeReason'].includes(columnName);
  }

  @CircuitBreaker({ key: 'db_postgresql' })
  async findCssAuditLogWithPagination (opts: FindCssQueryDto): Promise<{ cssAuditLog: CssAuditLogEntity[]; total: number }> {
    const { page, limit, search, entityType, entityId, action, changedBy, sortBy, sortOrder } = opts;

    const where: Record<string, unknown> = {};

    if (entityType) where['entityType'] = entityType;
    if (entityId) where['entityId'] = entityId;
    if (action) where['action'] = action;
    if (changedBy) where['changedBy'] = changedBy;

    const options: QueryAllWithPaginationOptions = {
      page: page ?? 1,
      limit: limit ?? 10,
      searchFields: ['entityType', 'action', 'changeReason'],
      orderBy: sortBy ?? 'createdAt',
      orderDirection: sortOrder ?? 'DESC',
      ...(Object.keys(where).length > 0 ? { where } : {}),
      ...(search ? { search } : {})
    };

    const result = await this.findAllWithPagination(options);

    return { cssAuditLog: result.data, total: result.total };
  }

  async findByEntityId (entityId: string, connection?: DatabaseAdapter): Promise<CssAuditLogEntity[]> {
    return this.findAll(
      {
        where: { entityId },
        orderBy: 'createdAt',
        orderDirection: 'DESC'
      },
      connection
    );
  }

  async findByEntityType (entityType: CssEntityType, connection?: DatabaseAdapter): Promise<CssAuditLogEntity[]> {
    return this.findAll(
      {
        where: { entityType },
        orderBy: 'createdAt',
        orderDirection: 'DESC'
      },
      connection
    );
  }

  async findByUser (changedBy: string, connection?: DatabaseAdapter): Promise<CssAuditLogEntity[]> {
    return this.findAll(
      {
        where: { changedBy },
        orderBy: 'createdAt',
        orderDirection: 'DESC'
      },
      connection
    );
  }

  async findRecentActivity (limit: number = 50, connection?: DatabaseAdapter): Promise<CssAuditLogEntity[]> {
    return this.findAll(
      {
        limit,
        orderBy: 'createdAt',
        orderDirection: 'DESC'
      },
      connection
    );
  }
}
