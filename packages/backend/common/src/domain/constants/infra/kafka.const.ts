import { Constructor } from '../../types/common/util.type';
import { KafkaSubscribeOptions } from '../../interfaces/infra/kafka.interface';

export const KAFKA_SUBSCRIBER_METADATA = 'kafka:subscriber';
export const KAFKA_ON_MESSAGE_METADATA = 'kafka:on-message';

export const KAFKA_SUBSCRIBER_REGISTRY: Constructor[] = [];

export interface KafkaSubscriberMetadata {
  methodName: string;
  options: KafkaSubscribeOptions;
}
