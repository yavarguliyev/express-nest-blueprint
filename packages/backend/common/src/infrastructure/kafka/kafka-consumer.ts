import { Consumer } from 'kafkajs';

import { KafkaSubscribeOptions } from '../../domain/interfaces/infra/kafka.interface';
import { KafkaMessageHandler } from '../../domain/types/infra/kafka.type';

export class KafkaConsumer {
  private consumer: Consumer;
  private isConsumerConnected = false;
  private handlers: Array<{ topic: string | RegExp; handler: KafkaMessageHandler<unknown> }> = [];
  private isRunning = false;

  constructor (
    consumer: Consumer,
    private readonly isWorkerRole: boolean
  ) {
    this.consumer = consumer;
  }

  getHandlers (): Array<{ topic: string | RegExp; handler: KafkaMessageHandler<unknown> }> {
    return this.handlers;
  }

  getConsumer (): Consumer {
    return this.consumer;
  }

  isConnected (): boolean {
    return this.isConsumerConnected;
  }

  setRunning (running: boolean): void {
    this.isRunning = running;
  }

  isConsumerRunning (): boolean {
    return this.isRunning;
  }

  async connect (): Promise<void> {
    if (!this.isConsumerConnected && this.isWorkerRole) {
      await this.consumer.connect();
      this.isConsumerConnected = true;
    }
  }

  async disconnect (): Promise<void> {
    if (this.isConsumerConnected && this.isWorkerRole) await this.consumer.disconnect();
    this.isConsumerConnected = false;
    this.isRunning = false;
  }

  async subscribe (options: KafkaSubscribeOptions, handler: KafkaMessageHandler<unknown>): Promise<void> {
    if (!this.isWorkerRole) return;
    if (!this.isConsumerConnected) await this.connect();
    await this.consumer.subscribe({ topic: options.topic, fromBeginning: options.fromBeginning ?? false });
    this.handlers.push({ topic: options.topic, handler: handler as unknown as KafkaMessageHandler<unknown> });
  }
}
