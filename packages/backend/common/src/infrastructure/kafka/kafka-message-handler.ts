import { EachMessagePayload } from 'kafkajs';

import { Logger } from '../logger/logger.service';
import { MetricsService } from '../metrics/metrics.service';
import { KafkaModuleOptions, KafkaMessagePayload } from '../../domain/interfaces/infra/kafka.interface';
import { KafkaMessageHandler } from '../../domain/types/infra/kafka.type';

export class KafkaMessageProcessor {
  constructor (
    private readonly options: KafkaModuleOptions,
    private readonly metricsService: MetricsService
  ) {}

  async processMessage (
    payload: EachMessagePayload,
    handlers: Array<{ topic: string | RegExp; handler: KafkaMessageHandler<unknown> }>
  ): Promise<void> {
    const { topic } = payload;
    const start = Date.now();
    const isInternalTopic = topic.startsWith('__');
    const matchingHandlers = this.findMatchingHandlers(topic, handlers, isInternalTopic);
    if (matchingHandlers.length === 0) return;
    const parsedPayload = this.parseMessage(payload);
    await this.executeHandlers(matchingHandlers, parsedPayload, topic, start);
  }

  private findMatchingHandlers (
    topic: string,
    handlers: Array<{ topic: string | RegExp; handler: KafkaMessageHandler<unknown> }>,
    isInternalTopic: boolean
  ): Array<{ topic: string | RegExp; handler: KafkaMessageHandler<unknown> }> {
    return handlers.filter(h => {
      if (typeof h.topic === 'string') return h.topic === topic;
      if (h.topic instanceof RegExp) {
        const isGenericRegex = h.topic.toString() === '/.*/';
        if (isInternalTopic && isGenericRegex) return false;
        return h.topic.test(topic);
      }

      return false;
    });
  }

  private parseMessage (payload: EachMessagePayload): KafkaMessagePayload<unknown> {
    const { topic, partition, message } = payload;

    let value: unknown = null;
    if (message.value) {
      try {
        value = JSON.parse(message.value.toString());
      } catch {
        value = message.value.toString();
      }
    }

    return {
      topic,
      partition,
      value,
      key: message.key,
      headers: message.headers as Record<string, string | Buffer | (string | Buffer)[]>,
      timestamp: message.timestamp
    };
  }

  private async executeHandlers (
    handlers: Array<{ topic: string | RegExp; handler: KafkaMessageHandler<unknown> }>,
    payload: KafkaMessagePayload<unknown>,
    topic: string,
    start: number
  ): Promise<void> {
    try {
      await Promise.all(
        handlers.map(async h => {
          try {
            await h.handler(payload);
          } catch {
            Logger.error(`Error in Kafka handler for topic ${topic}`, 'An unknown error occurred', 'KafkaService');
          }
        })
      );

      const duration = (Date.now() - start) / 1000;
      const groupId = this.options.consumerConfig?.groupId || 'default-group';

      this.metricsService.recordKafkaMessage(topic, groupId, 'success');
      this.metricsService.observeKafkaProcessing(topic, groupId, duration);
    } catch (error) {
      const groupId = this.options.consumerConfig?.groupId || 'default-group';
      this.metricsService.recordKafkaMessage(topic, groupId, 'error');
      throw error;
    }
  }
}
