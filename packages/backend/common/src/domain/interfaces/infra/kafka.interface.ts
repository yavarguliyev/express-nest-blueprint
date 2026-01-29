import { ConsumerConfig, KafkaConfig as KafkaJsConfig, ProducerConfig } from 'kafkajs';

export interface KafkaModuleOptions {
  config: KafkaJsConfig;
  producerConfig?: ProducerConfig;
  consumerConfig?: ConsumerConfig;
}

export interface KafkaMessagePayload<T = unknown> {
  topic: string;
  partition?: number;
  value: T;
  key?: string | Buffer | null;
  headers?: Record<string, string | Buffer | (string | Buffer)[]>;
  timestamp?: string;
}

export interface KafkaSubscribeOptions {
  topic: string | RegExp;
  fromBeginning?: boolean;
}
