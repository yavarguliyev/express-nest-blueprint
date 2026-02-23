import { PoolClient } from 'pg';

import { InternalServerErrorException } from '../../../domain/exceptions/http-exceptions';
import { DatabaseAdapter, QueryResult } from '../../../domain/interfaces/database/database.interface';

export class TransactionAdapter implements DatabaseAdapter {
  constructor(private client: PoolClient) {}

  isConnected = (): boolean => true;
  transaction = async <R>(callback: (adapter: DatabaseAdapter) => Promise<R>): Promise<R> => callback(this);
  transactionWithRetry = async <R>(callback: (adapter: DatabaseAdapter) => Promise<R>): Promise<R> => callback(this);

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const result = await this.client.query(sql, params);
    return { rows: this.validateQueryResult<T>(result.rows), rowCount: result.rowCount || 0 };
  }

  private validateQueryResult<T>(rows: unknown[]): T[] {
    if (!Array.isArray(rows)) throw new InternalServerErrorException('Invalid query result: expected array of rows');
    return rows as T[];
  }
}
