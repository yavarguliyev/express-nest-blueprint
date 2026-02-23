import {
  CircuitBreaker,
  CrudTable,
  Injectable,
  QueryAllWithPaginationOptions,
  CIRCUIT_BREAKER_KEYS,
  BaseRepository,
  DatabaseService
} from '@config/libs';

import { FindCssQueryDto } from '@modules/themes/dtos/find-css-audit-log.dto';
import { CssBackupEntity } from '@modules/themes/interfaces/theme.interface';
import { BackupNameParams, RecentBackupsParams } from '@modules/themes/types/theme.type';

@CrudTable({
  category: 'Database Management',
  name: 'css_backups',
  displayName: 'CSS Backups',
  actions: { create: false, update: false, delete: false }
})
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

  @CircuitBreaker({ key: CIRCUIT_BREAKER_KEYS.POSTGRES })
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

  async findByBackupName (params: BackupNameParams): Promise<CssBackupEntity | null> {
    const { backupName, connection } = params;
    return this.findOne({ backupName }, connection);
  }

  async findRecentBackups (params: RecentBackupsParams = {}): Promise<CssBackupEntity[]> {
    const { limit = 10, connection } = params;
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
