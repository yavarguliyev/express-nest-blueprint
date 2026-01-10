import { Pool, PoolClient } from 'pg';

import { Injectable } from '@common/decorators/injectable.decorator';
import { DatabaseAdapter, DatabaseConfig, QueryResult } from '@common/interfaces/database.interface';
import { TransactionAdapter } from '@core/database/adapters/transaction.adapter';
import { InternalServerErrorException } from '@common/exceptions';

@Injectable()
export class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: Pool | null = null;
  private config: DatabaseConfig;

  constructor (config: DatabaseConfig) {
    this.config = config;
  }

  async connect (): Promise<void> {
    if (this.pool) return;

    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      user: this.config.username,
      password: this.config.password,
      database: this.config.database,
      ssl: this.config.ssl,
      max: this.config.connectionLimit || 10
    });

    await this.pool.connect();
  }

  async disconnect (): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  isConnected (): boolean {
    return this.pool !== null;
  }

  async query<T = unknown> (sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    if (!this.pool) throw new InternalServerErrorException('Database not connected');
    const result = await this.pool.query(sql, params);
    return { rows: this.validateQueryResult<T>(result.rows), rowCount: result.rowCount || 0 };
  }

  private validateQueryResult<T> (rows: unknown[]): T[] {
    if (!Array.isArray(rows)) throw new InternalServerErrorException('Invalid query result: expected array of rows');
    return rows as T[];
  }

  async transaction<R> (callback: (adapter: DatabaseAdapter) => Promise<R>): Promise<R> {
    if (!this.pool) throw new InternalServerErrorException('Database not connected');

    const client: PoolClient = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const transactionAdapter = new TransactionAdapter(client);
      const result = await callback(transactionAdapter);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
