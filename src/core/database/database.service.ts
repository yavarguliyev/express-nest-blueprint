import { DATABASE_ADAPTER_MAP } from '@common/constants/common.const';
import { Injectable } from '@common/decorators';
import { InternalServerErrorException } from '@common/exceptions';
import { DatabaseAdapter, DatabaseConfig } from '@common/interfaces';

@Injectable()
export class DatabaseService {
  private adapters = new Map<string, DatabaseAdapter>();
  private defaultAdapter: DatabaseAdapter | null = null;
  private isClosing = false;
  private isClosed = false;

  async addConnection (name: string, config: DatabaseConfig): Promise<void> {
    const AdapterClass = DATABASE_ADAPTER_MAP[config.type];
    if (!AdapterClass) return;

    const adapter = new AdapterClass(config);
    await adapter.connect();
    this.adapters.set(name, adapter);

    if (!this.defaultAdapter) this.defaultAdapter = adapter;
  }

  getConnection (name?: string): DatabaseAdapter {
    if (!name && this.defaultAdapter) return this.defaultAdapter;
    if (name && this.adapters.has(name)) return this.adapters.get(name)!;

    throw new InternalServerErrorException(`Database connection '${name || 'default'}' not found`);
  }

  async closeAllConnections (): Promise<void> {
    if (this.isClosing || this.isClosed) return;

    this.isClosing = true;

    try {
      const disconnectPromises = Array.from(this.adapters.values()).map((adapter) => adapter.disconnect());
      await Promise.all(disconnectPromises);

      this.adapters.clear();
      this.defaultAdapter = null;
      this.isClosed = true;
    } finally {
      this.isClosing = false;
    }
  }

  getConnectionNames (): string[] {
    return Array.from(this.adapters.keys());
  }
}
