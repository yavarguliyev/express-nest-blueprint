import { Module } from '@common/decorators/module.decorator';
import { DynamicModule } from '@common/interfaces/common.interface';
import { DatabaseModuleOptions } from '@common/interfaces/database.interface';
import { Logger } from '@common/logger/logger.service';
import { ConfigService } from '@core/config/config.service';
import { getDatabaseConfig } from '@core/config/database.config';
import { DatabaseService } from '@core/database/database.service';
import { LifecycleService } from '@core/lifecycle/lifecycle.service';

@Module({
  providers: [DatabaseService],
  exports: [DatabaseService]
})
export class DatabaseModule {
  private static readonly logger = new Logger(DatabaseModule.name);

  static forRoot (options: DatabaseModuleOptions = {}): DynamicModule {
    const { connectionName = 'default', config } = options;

    return {
      module: DatabaseModule,
      global: true,
      providers: [
        DatabaseService,
        {
          provide: 'DATABASE_INITIALIZER',
          useFactory: ((databaseService: DatabaseService, lifecycleService: LifecycleService, configService: ConfigService): (() => Promise<void>) => {
            return async () => {
              const dbConfig = config || getDatabaseConfig();

              dbConfig.host = configService.get<string>('DB_HOST', dbConfig.host);
              dbConfig.port = configService.get<number>('DB_PORT', dbConfig.port);
              dbConfig.username = configService.get<string>('DB_USERNAME', dbConfig.username);
              dbConfig.password = configService.get<string>('DB_PASSWORD', dbConfig.password);
              dbConfig.database = configService.get<string>('DB_NAME', dbConfig.database);

              await databaseService.addConnection(connectionName, dbConfig);

              const hosts = dbConfig.replicaHosts || [];
              if (hosts.length > 0) {
                for (let i = 0; i < hosts.length; i++) {
                  await databaseService.addConnection(connectionName, { ...dbConfig, host: hosts[i] || 'localhost' }, true);
                }

                DatabaseModule.logger.log(`Initialized ${hosts.length} read replicas for '${connectionName}'`);
              }

              if (lifecycleService) {
                const disconnect = async () => await databaseService.closeAllConnections();
                lifecycleService.registerShutdownHandler({ name: 'Database service', disconnect });
              }
            };
          }) as (...args: unknown[]) => unknown,
          inject: [DatabaseService, LifecycleService, ConfigService]
        }
      ],
      exports: [DatabaseService, 'DATABASE_INITIALIZER']
    };
  }
}
