import { BULLMQ_OPTIONS, BULLMQ_SERVICE_TOKEN, Module, QUEUE_MANAGER_TOKEN } from '@common/decorators';
import { DynamicModule, BullMQModuleOptions } from '@common/interfaces';
import { ObjectProvider } from '@common/types';
import { ConfigService } from '@core/config';
import { BullMQService } from '@core/bullmq/services/bullmq.service';
import { QueueManager } from '@core/bullmq/services/queue-manager.service';

@Module({})
export class BullMQModule {
  static forRoot (): DynamicModule {
    const bullmqOptionsProvider: ObjectProvider<BullMQModuleOptions> = {
      provide: BULLMQ_OPTIONS,
      useFactory: (...args: unknown[]): BullMQModuleOptions => {
        const configService = args[0] as ConfigService;
        const redisPassword = configService.get('REDIS_PASSWORD');
        const removeOnComplete = parseInt(configService.get('QUEUE_REMOVE_ON_COMPLETE') ?? '100', 10);
        const removeOnFail = parseInt(configService.get('QUEUE_REMOVE_ON_FAIL') ?? '50', 10);
        const attempts = parseInt(configService.get('QUEUE_ATTEMPTS') ?? '3', 10);
        const backoffType = (configService.get('QUEUE_BACKOFF_TYPE') ?? 'exponential');
        const backoffDelay = parseInt(configService.get('QUEUE_BACKOFF_DELAY') ?? '2000', 10);

        return {
          redis: {
            host: configService.get('REDIS_HOST') || 'localhost',
            port: parseInt(configService.get('REDIS_PORT') || '6379', 10),
            ...(redisPassword && { password: redisPassword }),
            db: parseInt(configService.get('REDIS_DB') || '0', 10),
            concurrency: parseInt(configService.get('REDIS_CONCURRENCY') || '5', 10)
          },
          defaultJobOptions: {
            removeOnComplete,
            removeOnFail,
            attempts,
            backoff: { type: backoffType, delay: backoffDelay }
          }
        };
      },
      inject: [ConfigService]
    };

    const queueManagerProvider: ObjectProvider<QueueManager> = {
      provide: QUEUE_MANAGER_TOKEN,
      useFactory: (...args: unknown[]): QueueManager => new QueueManager(args[0] as BullMQModuleOptions),
      inject: [BULLMQ_OPTIONS]
    };

    const bullmqServiceProvider: ObjectProvider<BullMQService> = {
      provide: BULLMQ_SERVICE_TOKEN,
      useFactory: (...args: unknown[]): BullMQService => new BullMQService(args[0] as QueueManager),
      inject: [QUEUE_MANAGER_TOKEN]
    };

    return {
      module: BullMQModule,
      global: true,
      providers: [bullmqOptionsProvider, queueManagerProvider, bullmqServiceProvider],
      exports: [BULLMQ_SERVICE_TOKEN, QUEUE_MANAGER_TOKEN, BULLMQ_OPTIONS]
    };
  }
}
