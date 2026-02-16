import { Pool, PoolClient } from 'pg';

import { TransactionAdapter } from '../adapters/transaction.adapter';
import { Injectable } from '../../../core/decorators/injectable.decorator';
import { DatabaseAdapter, DatabaseConfig, QueryResult } from '../../../domain/interfaces/database/database.interface';
import { InternalServerErrorException, ServiceUnavailableException } from '../../../domain/exceptions/http-exceptions';
import { MetricsService } from '../../metrics/metrics.service';

@Injectable()
export class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: Pool | null = null;
  private config: DatabaseConfig;
  private isDisconnecting = false;

  constructor (
    config: DatabaseConfig,
    private readonly metricsService: MetricsService
  ) {
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
      max: this.config.connectionLimit || 10,
      min: this.config.minLimit || 2,
      idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis || 2000
    });

    const client = await this.pool.connect();
    client.release();
  }

  async disconnect (): Promise<void> {
    if (!this.pool || this.isDisconnecting) return;

    this.isDisconnecting = true;

    try {
      const disconnectPromise = this.pool.end();
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new ServiceUnavailableException('Database disconnect timeout')), 2000);
      });

      await Promise.race([disconnectPromise, timeoutPromise]);
      this.pool = null;
    } catch (error) {
      this.pool = null;
      throw error;
    } finally {
      this.isDisconnecting = false;
    }
  }

  isConnected (): boolean {
    return this.pool !== null;
  }

  async query<T = unknown> (sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    if (!this.pool) throw new InternalServerErrorException('Database not connected');

    const start = Date.now();
    const queryType = sql.trim().split(/\s+/)[0]?.toUpperCase() || 'UNKNOWN';

    try {
      const result = await this.pool.query(sql, params);
      const duration = (Date.now() - start) / 1000;

      this.metricsService.observeDatabaseQuery(queryType, this.config.database, duration);
      this.metricsService.setDatabaseConnections(this.pool.totalCount - this.pool.idleCount);

      return { rows: this.validateQueryResult<T>(result.rows), rowCount: result.rowCount || 0 };
    } catch (error) {
      this.metricsService.setDatabaseConnections(this.pool.totalCount - this.pool.idleCount);
      throw error;
    }
  }

  async transaction<R> (callback: (adapter: DatabaseAdapter) => Promise<R>): Promise<R> {
    return this.transactionWithRetry(callback, 1);
  }

  async transactionWithRetry<R> (callback: (adapter: DatabaseAdapter) => Promise<R>, retries = 3): Promise<R> {
    if (!this.pool) throw new InternalServerErrorException('Database not connected');

    let lastError: unknown;
    for (let attempt = 0; attempt < retries; attempt++) {
      const client: PoolClient = await this.pool.connect();

      try {
        await client.query('BEGIN');
        const transactionAdapter = new TransactionAdapter(client);
        const result = await callback(transactionAdapter);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        lastError = error;

        if (error && typeof error === 'object' && 'code' in error) {
          if (error.code === '40P01' || error.code === '40001') {
            const delay = Math.pow(2, attempt) * 100;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error;
      } finally {
        client.release();
      }
    }

    throw lastError;
  }

  private validateQueryResult<T> (rows: unknown[]): T[] {
    if (!Array.isArray(rows)) throw new InternalServerErrorException('Invalid query result: expected array of rows');
    return rows as T[];
  }
}
