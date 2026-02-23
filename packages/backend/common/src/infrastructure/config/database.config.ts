import { ConfigService } from './config.service';
import { DatabaseType } from '../../domain/enums/database/database.enum';
import { DatabaseConfig } from '../../domain/interfaces/database/database.interface';

const getHost = (configService?: ConfigService): string => configService?.get<string>('DB_HOST') || 'localhost';
const getPort = (configService?: ConfigService): number => configService?.get<number>('DB_PORT') || 5432;
const getUsername = (configService?: ConfigService): string => configService?.get<string>('DB_USERNAME') || 'postgres';
const getPassword = (configService?: ConfigService): string => configService?.get<string>('DB_PASSWORD') || 'postgres';
const getDatabase = (configService?: ConfigService): string => configService?.get<string>('DB_NAME') || 'express_nest_blueprint';
const getReplicaHosts = (configService?: ConfigService): string[] => configService?.get<string>('DB_REPLICA_HOSTS')?.split(',') || [];
const getSsl = (configService?: ConfigService): boolean => configService?.get<boolean>('DB_SSL') || false;
const getConnectionLimit = (configService?: ConfigService): number => configService?.get<number>('DB_CONNECTION_LIMIT') || 10;
const getMinLimit = (configService?: ConfigService): number => configService?.get<number>('DB_MIN_LIMIT') || 2;
const getIdleTimeout = (configService?: ConfigService): number => configService?.get<number>('DB_IDLE_TIMEOUT') || 30000;
const getConnectionTimeout = (configService?: ConfigService): number => configService?.get<number>('DB_CONNECTION_TIMEOUT') || 2000;

export const getDatabaseConfig = (configService?: ConfigService): DatabaseConfig => {
  return {
    type: DatabaseType.POSTGRESQL,
    host: getHost(configService),
    port: getPort(configService),
    username: getUsername(configService),
    password: getPassword(configService),
    database: getDatabase(configService),
    replicaHosts: getReplicaHosts(configService),
    ssl: getSsl(configService),
    connectionLimit: getConnectionLimit(configService),
    minLimit: getMinLimit(configService),
    idleTimeoutMillis: getIdleTimeout(configService),
    connectionTimeoutMillis: getConnectionTimeout(configService)
  };
};
