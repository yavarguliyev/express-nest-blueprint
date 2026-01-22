import { DATABASE_ADAPTER_MAP } from '../../domain/constants/common.const';
import { Injectable } from '../../core/decorators/injectable.decorator';
import { InternalServerErrorException } from '../../domain/exceptions/http-exceptions';
import { DatabaseAdapter, DatabaseConfig } from '../../domain/interfaces/database.interface';

@Injectable()
export class DatabaseService {
  private adapters = new Map<string, DatabaseAdapter>();
  private defaultAdapter: DatabaseAdapter | null = null;
  private isClosing = false;
  private isClosed = false;

  async addConnection (name: string, config: DatabaseConfig, isReadOnly = false): Promise<void> {
    const AdapterClass = DATABASE_ADAPTER_MAP[config.type];
    if (!AdapterClass) return;

    const adapter = new AdapterClass(config);
    await adapter.connect();

    const connectionKey = isReadOnly ? `${name}_read` : name;
    this.adapters.set(connectionKey, adapter);

    if (!isReadOnly && !this.defaultAdapter) this.defaultAdapter = adapter;
  }

  getConnection (name?: string): DatabaseAdapter {
    if (!name && this.defaultAdapter) return this.defaultAdapter;
    if (name && this.adapters.has(name)) return this.adapters.get(name)!;

    throw new InternalServerErrorException(`Database connection '${name || 'default'}' not found`);
  }

  getReadConnection (name = 'default'): DatabaseAdapter {
    const readKey = `${name}_read`;
    if (this.adapters.has(readKey)) return this.adapters.get(readKey)!;
    return this.getConnection(name);
  }

  getWriteConnection (name = 'default'): DatabaseAdapter {
    return this.getConnection(name);
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
