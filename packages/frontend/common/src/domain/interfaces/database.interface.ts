export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
  fields: QueryField[];
}

export interface QueryField {
  name: string;
  dataType: string;
  nullable: boolean;
}

export interface DatabaseHealth {
  connected: boolean;
  latency: number;
  version: string;
  uptime: number;
}
