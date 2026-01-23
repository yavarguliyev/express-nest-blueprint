import { Kafka, Producer, Consumer, EachMessageHandler } from 'kafkajs';
import { Injectable, Inject } from '../../core/decorators/injectable.decorator';
import { KafkaModuleOptions, KafkaMessagePayload, KafkaSubscribeOptions, KafkaMessageHandler } from './kafka.interfaces';

export const KAFKA_OPTIONS = Symbol('KAFKA_OPTIONS');

@Injectable()
export class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private isProducerConnected = false;
  private isConsumerConnected = false;

  constructor (@Inject(KAFKA_OPTIONS) private options: KafkaModuleOptions) {
    this.kafka = new Kafka(this.options.config);
    this.producer = this.kafka.producer(this.options.producerConfig);
    this.consumer = this.kafka.consumer({
      groupId: this.options.consumerConfig?.groupId || 'default-group',
      ...this.options.consumerConfig,
    });
  }

  async connect (): Promise<void> {
    if (!this.isProducerConnected) {
      await this.producer.connect();
      this.isProducerConnected = true;
    }
    if (!this.isConsumerConnected) {
      await this.consumer.connect();
      this.isConsumerConnected = true;
    }
  }

  async disconnect (): Promise<void> {
    await this.producer.disconnect();
    await this.consumer.disconnect();
    this.isProducerConnected = false;
    this.isConsumerConnected = false;
  }

  async produce<T = unknown> (payload: KafkaMessagePayload<T>): Promise<void> {
    if (!this.isProducerConnected) {
      await this.connect();
    }

    await this.producer.send({
      topic: payload.topic,
      messages: [
        {
          key: payload.key ?? null,
          value: JSON.stringify(payload.value),
          headers: payload.headers ?? {},
          ...(payload.timestamp ? { timestamp: payload.timestamp } : {}),
        },
      ],
    });
  }

  async subscribe (options: KafkaSubscribeOptions, handler: KafkaMessageHandler): Promise<void> {
    if (!this.isConsumerConnected) {
      await this.connect();
    }

    await this.consumer.subscribe({
      topic: options.topic,
      fromBeginning: options.fromBeginning ?? false,
    });

    const eachMessageHandler: EachMessageHandler = async ({ topic, partition, message }) => {
      const value = message.value ? (JSON.parse(message.value.toString()) as unknown) : null;
      await handler({
        topic,
        partition,
        value,
        key: message.key,
        headers: message.headers as Record<string, string | Buffer | (string | Buffer)[]>,
        timestamp: message.timestamp,
      });
    };

    await this.consumer.run({
      eachMessage: eachMessageHandler,
    });
  }
}
