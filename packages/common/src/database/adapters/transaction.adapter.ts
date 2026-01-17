import { PoolClient } from 'pg';

import { InternalServerErrorException } from '../../exceptions/http-exceptions';
import { DatabaseAdapter, QueryResult } from '../../interfaces/database.interface';

export class TransactionAdapter implements DatabaseAdapter {
  constructor (private client: PoolClient) {}

  async connect (): Promise<void> {}
  async disconnect (): Promise<void> {}

  isConnected (): boolean {
    return true;
  }

  async query<T = unknown> (sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const result = await this.client.query(sql, params);
    return { rows: this.validateQueryResult<T>(result.rows), rowCount: result.rowCount || 0 };
  }

  private validateQueryResult<T> (rows: unknown[]): T[] {
    if (!Array.isArray(rows)) throw new InternalServerErrorException('Invalid query result: expected array of rows');
    return rows as T[];
  }

  async transaction<R> (callback: (adapter: DatabaseAdapter) => Promise<R>): Promise<R> {
    return callback(this);
  }

  async transactionWithRetry<R> (callback: (adapter: DatabaseAdapter) => Promise<R>): Promise<R> {
    return callback(this);
  }
}
