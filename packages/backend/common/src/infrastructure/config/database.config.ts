import { ConfigService } from './config.service';
import { DatabaseType } from '../../domain/enums/database/database.enum';
import { DatabaseConfig } from '../../domain/interfaces/database/database.interface';

export const getDatabaseConfig = (configService?: ConfigService): DatabaseConfig => {
  return {
    type: DatabaseType.POSTGRESQL,
    host: configService?.get<string>('DB_HOST') || 'localhost',
    port: configService?.get<number>('DB_PORT') || 5432,
    username: configService?.get<string>('DB_USERNAME') || 'postgres',
    password: configService?.get<string>('DB_PASSWORD') || 'postgres',
    database: configService?.get<string>('DB_NAME') || 'express_nest_blueprint',
    replicaHosts: configService?.get<string>('DB_REPLICA_HOSTS')?.split(',') || [],
    ssl: configService?.get<boolean>('DB_SSL') || false,
    connectionLimit: configService?.get<number>('DB_CONNECTION_LIMIT') || 10,
    minLimit: configService?.get<number>('DB_MIN_LIMIT') || 2,
    idleTimeoutMillis: configService?.get<number>('DB_IDLE_TIMEOUT') || 30000,
    connectionTimeoutMillis: configService?.get<number>('DB_CONNECTION_TIMEOUT') || 2000
  };
};
