import { DatabaseType } from '../../enums/database/database.enum';
import { JoinType } from '../../types/database/database.type';

export interface DatabaseAdapter<T = unknown> extends DatabaseConnection {
  query<R = T>(sql: string, params?: unknown[]): Promise<QueryResult<R>>;
  transaction<R>(callback: (adapter: DatabaseAdapter<T>) => Promise<R>): Promise<R>;
  transactionWithRetry<R>(callback: (adapter: DatabaseAdapter<T>) => Promise<R>, retries?: number): Promise<R>;
}

export interface DatabaseConfig {
  connectionLimit?: number;
  minLimit?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  database: string;
  host: string;
  password: string;
  port: number;
  replicaHosts?: string[];
  ssl?: boolean;
  type: DatabaseType;
  username: string;
}

export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export interface DatabaseModuleOptions {
  connectionName?: string;
  config?: DatabaseConfig;
}

export interface QueryResult<T = unknown> {
  rowCount: number;
  rows: T[];
}

export interface JoinClause {
  type: JoinType;
  table: string;
  on: string;
}
