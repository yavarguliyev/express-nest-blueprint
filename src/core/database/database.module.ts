import { Module } from '@common/decorators';
import { DynamicModule, DatabaseModuleOptions } from '@common/interfaces';
import { getErrorMessage } from '@common/helpers';
import { Logger } from '@common/logger';
import { getDatabaseConfig } from '@core/config';
import { DatabaseService } from '@core/database/database.service';
import { LifecycleService } from '@core/lifecycle/lifecycle.service';

@Module({
  providers: [DatabaseService],
  exports: [DatabaseService]
})
export class DatabaseModule {
  private static readonly logger = new Logger('DatabaseModule');

  static forRoot (options: DatabaseModuleOptions = {}): DynamicModule {
    const { connectionName = 'default', config } = options;

    return {
      module: DatabaseModule,
      global: true,
      providers: [
        DatabaseService,
        {
          provide: 'DATABASE_INITIALIZER',
          useFactory: ((databaseService: DatabaseService, lifecycleService: LifecycleService): (() => Promise<void>) => {
            return async () => {
              try {
                const dbConfig = config || getDatabaseConfig();
                await databaseService.addConnection(connectionName, dbConfig);

                const replicaHosts = process.env['DB_REPLICA_HOSTS'];
                if (replicaHosts) {
                  const hosts = replicaHosts.split(',');
                  for (let i = 0; i < hosts.length; i++) {
                    await databaseService.addConnection(connectionName, { ...dbConfig, host: hosts[i] || 'localhost' }, true);
                  }

                  DatabaseModule.logger.log(`Initialized ${hosts.length} read replicas for '${connectionName}'`);
                }

                if (lifecycleService) {
                  const disconnect = async () => await databaseService.closeAllConnections();
                  lifecycleService.registerShutdownHandler({ name: 'Database service', disconnect });
                }
              } catch (error) {
                DatabaseModule.logger.error(`Failed to establish database connection '${connectionName}'`, getErrorMessage(error));
                throw error;
              }
            };
          }) as (...args: unknown[]) => unknown,
          inject: [DatabaseService, LifecycleService]
        }
      ],
      exports: [DatabaseService, 'DATABASE_INITIALIZER']
    };
  }
}
