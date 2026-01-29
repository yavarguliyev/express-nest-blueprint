import { logLevel } from 'kafkajs';

import { KafkaService } from './kafka.service';
import { KafkaExplorer } from './kafka-explorer';
import { ConfigService } from '../config/config.service';
import { LifecycleService } from '../../application/lifecycle/lifecycle.service';
import { Module } from '../../core/decorators/module.decorator';
import { KAFKA_OPTIONS } from '../../core/decorators/kafka.decorators';
import { KafkaModuleOptions } from '../../domain/interfaces/infra/kafka.interface';
import { DynamicModule } from '../../domain/interfaces/module/module.interface';

@Module({
  providers: [KafkaService],
  exports: [KafkaService]
})
export class KafkaModule {
  static forRoot (options?: KafkaModuleOptions): DynamicModule {
    return {
      module: KafkaModule,
      global: true,
      providers: [
        {
          provide: KAFKA_OPTIONS as symbol,
          useFactory: ((configService: ConfigService) => {
            if (options) return options;

            const brokers = configService.get<string>('KAFKA_BROKERS', 'localhost:29092').split(',');
            const clientId = configService.get<string>('KAFKA_CLIENT_ID', 'express-nest-blueprint');
            const groupId = configService.get<string>('KAFKA_GROUP_ID', 'express-nest-blueprint-group');

            return {
              config: {
                clientId,
                brokers,
                logLevel: logLevel.INFO
              },
              consumerConfig: {
                groupId
              }
            };
          }) as (...args: unknown[]) => unknown,
          inject: [ConfigService]
        },
        KafkaService,
        KafkaExplorer,
        {
          provide: 'KAFKA_INITIALIZER',
          useFactory: ((kafkaService: KafkaService, lifecycleService: LifecycleService) => {
            return (): Promise<void> => {
              if (lifecycleService) {
                lifecycleService.registerShutdownHandler({
                  name: 'Kafka Service',
                  disconnect: () => kafkaService.disconnect()
                });
              }
              return kafkaService.connect();
            };
          }) as (...args: unknown[]) => unknown,
          inject: [KafkaService, LifecycleService]
        },
        {
          provide: 'KAFKA_SUBSCRIBER_INITIALIZER',
          useFactory: ((kafkaExplorer: KafkaExplorer) => {
            return (): Promise<void> => kafkaExplorer.explore();
          }) as (...args: unknown[]) => unknown,
          inject: [KafkaExplorer]
        }
      ],
      exports: [KafkaService, KAFKA_OPTIONS as symbol, 'KAFKA_INITIALIZER', 'KAFKA_SUBSCRIBER_INITIALIZER']
    };
  }
}
