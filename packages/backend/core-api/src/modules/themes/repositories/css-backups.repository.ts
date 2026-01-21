import { BaseRepository, CircuitBreaker, CrudTable, DatabaseService, Injectable, QueryAllWithPaginationOptions, DatabaseAdapter } from '@config/libs';

import { FindCssQueryDto } from '@modules/themes/dtos/find-css-audit-log.dto';
import { CssBackupEntity } from '@modules/themes/interfaces/theme.interface';

@CrudTable({ category: 'Database Management', name: 'css_backups', displayName: 'CSS Backups' })
@Injectable()
export class CssBackupsRepository extends BaseRepository<CssBackupEntity> {
  constructor (databaseService: DatabaseService) {
    super(databaseService, 'css_backups', {
      backupName: 'backup_name',
      backupDate: 'backup_date',
      totalFiles: 'total_files',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  protected getSelectColumns (): string[] {
    return ['id', 'backupName', 'backupDate', 'totalFiles', 'location', 'purpose', 'notes', 'createdAt', 'updatedAt'];
  }

  override getSearchableFields (): string[] {
    return ['backupName', 'location', 'purpose', 'notes'];
  }

  protected override inferColumnType (columnName: string): string {
    if (columnName === 'totalFiles') return 'number';
    if (columnName === 'backupDate') return 'datetime';
    return super.inferColumnType(columnName);
  }

  @CircuitBreaker({ key: 'db_postgresql' })
  async findCssBackupsWithPagination (opts: FindCssQueryDto): Promise<{ cssBackups: CssBackupEntity[]; total: number }> {
    const { page, limit, search, sortBy, sortOrder } = opts;

    const options: QueryAllWithPaginationOptions = {
      page: page ?? 1,
      limit: limit ?? 10,
      searchFields: ['backupName', 'location', 'purpose', 'notes'],
      orderBy: sortBy ?? 'backupDate',
      orderDirection: sortOrder ?? 'DESC',
      ...(search ? { search } : {})
    };

    const result = await this.findAllWithPagination(options);

    return { cssBackups: result.data, total: result.total };
  }

  async findByBackupName (backupName: string, connection?: DatabaseAdapter): Promise<CssBackupEntity | null> {
    return this.findOne({ backupName }, connection);
  }

  async findRecentBackups (limit: number = 10, connection?: DatabaseAdapter): Promise<CssBackupEntity[]> {
    return this.findAll(
      {
        limit,
        orderBy: 'backupDate',
        orderDirection: 'DESC'
      },
      connection
    );
  }
}
