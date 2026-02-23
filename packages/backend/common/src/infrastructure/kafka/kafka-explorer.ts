import { KafkaService } from './kafka.service';
import { Logger } from '../logger/logger.service';
import { Container } from '../../core/container/container';
import { Injectable } from '../../core/decorators/injectable.decorator';
import { KAFKA_ON_MESSAGE_METADATA, KAFKA_SUBSCRIBER_REGISTRY } from '../../domain/constants/infra/kafka.const';
import { KafkaSubscriberMetadata } from 'domain/interfaces/infra/kafka.interface';
import { getErrorMessage } from '../../domain/helpers/utility-functions.helper';
import { KafkaMessageHandler } from '../../domain/types/infra/kafka.type';

@Injectable()
export class KafkaExplorer {
  private readonly logger = new Logger(KafkaExplorer.name);
  private isExplored = false;

  constructor(
    private readonly container: Container,
    private readonly kafkaService: KafkaService
  ) {}

  async explore(): Promise<void> {
    if (this.isExplored) return;
    this.isExplored = true;

    for (const subscriberClass of KAFKA_SUBSCRIBER_REGISTRY) {
      if (!this.container.has(subscriberClass)) {
        this.container.register({ provide: subscriberClass, useClass: subscriberClass });
      }

      const instance = this.container.resolve({ provide: subscriberClass }) as unknown as Record<string, KafkaMessageHandler>;
      const handlers = Reflect.getMetadata(KAFKA_ON_MESSAGE_METADATA, subscriberClass) as KafkaSubscriberMetadata[] | undefined;

      if (!handlers) continue;

      for (const handler of handlers) {
        const { methodName, options } = handler;

        await this.kafkaService.subscribe(options, async payload => {
          try {
            const method = instance[methodName];
            if (typeof method === 'function') await method.apply(instance, [payload]);
          } catch (error) {
            await this.logger.error(`Error in Kafka subscriber ${subscriberClass.name}.${methodName}:`, getErrorMessage(error));
          }
        });
      }
    }

    await this.kafkaService.start();
    KAFKA_SUBSCRIBER_REGISTRY.length = 0;
  }
}
