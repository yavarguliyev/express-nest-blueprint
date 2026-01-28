import { Injectable, BaseRepository, DatabaseService, NotFoundException } from '@config/libs';

import { SystemSetting } from '@modules/settings/interfaces/settings.interface';

@Injectable()
export class SettingsRepository extends BaseRepository<SystemSetting> {
  constructor (databaseService: DatabaseService) {
    super(databaseService, 'system_settings', {
      isActive: 'is_active',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  protected getSelectColumns (): string[] {
    return ['id', 'key', 'value', 'category', 'description', 'isActive', 'createdAt', 'updatedAt'];
  }

  async findByKey (key: string): Promise<SystemSetting | null> {
    const columns = this.getSelectColumns();
    const { query, params } = this.queryBuilder.buildSelectQuery(columns, { where: { key } });

    const db = this.databaseService.getReadConnection();
    const result = await db.query<SystemSetting>(query, params);

    return result.rows[0] || null;
  }

  override async findAll (): Promise<SystemSetting[]> {
    const columns = this.getSelectColumns();
    const { query, params } = this.queryBuilder.buildSelectQuery(columns, { orderBy: 'category, key' });
    const db = this.databaseService.getReadConnection();
    const result = await db.query<SystemSetting>(query, params);

    return result.rows;
  }

  async updateByKey (key: string, value: unknown): Promise<SystemSetting> {
    const setting = await this.findByKey(key);
    if (!setting) throw new NotFoundException(`Setting with key "${key}" not found`);

    const { query, params } = this.queryBuilder.buildUpdateQuery(setting.id, { value }, this.getSelectColumns());
    const db = this.databaseService.getWriteConnection();
    const result = await db.query<SystemSetting>(query, params);

    if (!result.rows[0]) throw new NotFoundException(`Failed to update setting with key "${key}"`);

    return result.rows[0];
  }

  async updateActiveStatus (key: string, isActive: boolean): Promise<SystemSetting> {
    const setting = await this.findByKey(key);
    if (!setting) throw new NotFoundException(`Setting with key "${key}" not found`);

    const { query, params } = this.queryBuilder.buildUpdateQuery(setting.id, { isActive }, this.getSelectColumns());
    const db = this.databaseService.getWriteConnection();
    const result = await db.query<SystemSetting>(query, params);

    if (!result.rows[0]) throw new NotFoundException(`Failed to update active status for setting "${key}"`);

    return result.rows[0];
  }
}
