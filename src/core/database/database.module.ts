import { getErrorMessage } from '@common/helpers';
import { Module } from '@common/decorators';
import { DynamicModule, DatabaseModuleOptions } from '@common/interfaces';
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
          useFactory: ((databaseService: DatabaseService, lifecycleService: LifecycleService): () => Promise<void> => {
            return async () => {
              try {
                const dbConfig = config || getDatabaseConfig();
                await databaseService.addConnection(connectionName, dbConfig);

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
