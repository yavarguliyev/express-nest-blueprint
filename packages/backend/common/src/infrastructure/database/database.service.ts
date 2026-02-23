import { Injectable } from '../../core/decorators/injectable.decorator';
import { DATABASE_ADAPTER_MAP } from '../../domain/constants/database/database.const';
import { InternalServerErrorException } from '../../domain/exceptions/http-exceptions';
import { DatabaseAdapter, DatabaseConfig } from '../../domain/interfaces/database/database.interface';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class DatabaseService {
  private adapters = new Map<string, DatabaseAdapter>();
  private defaultAdapter: DatabaseAdapter | null = null;
  private isClosing = false;
  private isClosed = false;

  constructor(private readonly metricsService: MetricsService) {}

  getWriteConnection = (name = 'default'): DatabaseAdapter => this.getConnection(name);
  getConnectionNames = (): string[] => Array.from(this.adapters.keys());

  getConnection(name?: string): DatabaseAdapter {
    if (!name && this.defaultAdapter) return this.defaultAdapter;
    if (name && this.adapters.has(name)) return this.adapters.get(name)!;
    throw new InternalServerErrorException(`Database connection '${name || 'default'}' not found`);
  }

  getReadConnection(name = 'default'): DatabaseAdapter {
    const readKey = `${name}_read`;
    if (this.adapters.has(readKey)) return this.adapters.get(readKey)!;
    return this.getConnection(name);
  }

  async addConnection(name: string, config: DatabaseConfig, isReadOnly = false): Promise<void> {
    const AdapterClass = DATABASE_ADAPTER_MAP[config.type];
    if (!AdapterClass) return;

    const adapter = new AdapterClass(config, this.metricsService);
    await adapter.connect();

    const connectionKey = isReadOnly ? `${name}_read` : name;
    this.adapters.set(connectionKey, adapter);

    if (!isReadOnly && !this.defaultAdapter) this.defaultAdapter = adapter;
  }

  async closeAllConnections(): Promise<void> {
    if (this.isClosing || this.isClosed) return;

    this.isClosing = true;

    try {
      const disconnectPromises = Array.from(this.adapters.values()).map(adapter => adapter.disconnect());
      await Promise.all(disconnectPromises);

      this.adapters.clear();
      this.defaultAdapter = null;
      this.isClosed = true;
    } finally {
      this.isClosing = false;
    }
  }
}
