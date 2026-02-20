import { KafkaService } from './kafka.service';
import { KafkaExplorer } from './kafka-explorer';
import { ConfigService } from '../config/config.service';
import { LifecycleService } from '../../application/lifecycle/lifecycle.service';
import { Module } from '../../core/decorators/module.decorator';
import { KAFKA_OPTIONS } from '../../core/decorators/kafka.decorators';
import { KafkaModuleOptions } from '../../domain/interfaces/infra/kafka.interface';
import { DynamicModule } from '../../domain/interfaces/module/module.interface';
import { createKafkaOptions, createKafkaInitializer, createKafkaSubscriberInitializer } from './kafka-config.helper';

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
            return createKafkaOptions(configService, options);
          }) as (...args: unknown[]) => unknown,
          inject: [ConfigService]
        },
        KafkaService,
        KafkaExplorer,
        {
          provide: 'KAFKA_INITIALIZER',
          useFactory: createKafkaInitializer as (...args: unknown[]) => unknown,
          inject: [KafkaService, LifecycleService]
        },
        {
          provide: 'KAFKA_SUBSCRIBER_INITIALIZER',
          useFactory: createKafkaSubscriberInitializer as (...args: unknown[]) => unknown,
          inject: [KafkaExplorer]
        }
      ],
      exports: [KafkaService, KAFKA_OPTIONS as symbol, 'KAFKA_INITIALIZER', 'KAFKA_SUBSCRIBER_INITIALIZER']
    };
  }
}
