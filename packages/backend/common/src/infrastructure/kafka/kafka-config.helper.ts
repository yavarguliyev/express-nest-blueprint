import { logLevel } from 'kafkajs';

import { ConfigService } from '../config/config.service';
import { KafkaModuleOptions } from '../../domain/interfaces/infra/kafka.interface';

export const createKafkaOptions = (configService: ConfigService, options?: KafkaModuleOptions): KafkaModuleOptions => {
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
};

export const createKafkaInitializer = (
  kafkaService: { connect: () => Promise<void>; disconnect: () => Promise<void> },
  lifecycleService?: { registerShutdownHandler: (handler: { name: string; disconnect: () => Promise<void> }) => void }
): (() => Promise<void>) => {
  return (): Promise<void> => {
    if (lifecycleService) {
      lifecycleService.registerShutdownHandler({
        name: 'Kafka Service',
        disconnect: () => kafkaService.disconnect()
      });
    }

    return kafkaService.connect();
  };
};

export const createKafkaSubscriberInitializer = (kafkaExplorer: { explore: () => Promise<void> }): (() => Promise<void>) => {
  return (): Promise<void> => kafkaExplorer.explore();
};
