import { DatabaseType } from '@common/enums';
import { DatabaseConfig } from '@common/interfaces/database.interface';

export const getDatabaseConfig = (): DatabaseConfig => {
  return {
    type: DatabaseType.POSTGRESQL,
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432', 10),
    username: process.env['DB_USERNAME'] || 'postgres',
    password: process.env['DB_PASSWORD'] || 'postgres',
    database: process.env['DB_NAME'] || 'express_nest_blueprint',
    replicaHosts: process.env['DB_REPLICA_HOSTS'] ? process.env['DB_REPLICA_HOSTS'].split(',') : [],
    ssl: process.env['DB_SSL'] === 'true',
    connectionLimit: parseInt(process.env['DB_CONNECTION_LIMIT'] || '10', 10),
    minLimit: parseInt(process.env['DB_MIN_LIMIT'] || '2', 10),
    idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env['DB_CONNECTION_TIMEOUT'] || '2000', 10)
  };
};
