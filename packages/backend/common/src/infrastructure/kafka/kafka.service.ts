import { Kafka, Producer, Consumer, logLevel, LogEntry } from 'kafkajs';

import { Logger } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { MetricsService } from '../metrics/metrics.service';
import { Inject, Injectable } from '../../core/decorators/injectable.decorator';
import { KAFKA_OPTIONS } from '../../core/decorators/kafka.decorators';
import { KafkaMessagePayload, KafkaModuleOptions, KafkaSubscribeOptions } from '../../domain/interfaces/infra/kafka.interface';
import { getErrorMessage } from '../../domain/helpers/utility-functions.helper';
import { KafkaMessageHandler } from '../../domain/types/infra/kafka.type';

@Injectable()
export class KafkaService {
  private readonly isWorkerRole: boolean;
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  private isProducerConnected = false;
  private isConsumerConnected = false;
  private lastTotalMessages = 0;
  private lastMetricsTimestamp = Date.now();

  constructor (
    @Inject(KAFKA_OPTIONS) private options: KafkaModuleOptions,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService
  ) {
    this.isWorkerRole = this.configService.get<string>('APP_ROLE', 'api').toLowerCase() === 'worker';

    const kafkaLogger = (): ((entry: LogEntry) => void) => {
      return (entry: LogEntry): void => {
        const { label, level, log } = entry;
        const { message, ...extra } = log;

        const context = `Kafka:${label}`;

        const messageStr = typeof message === 'string' ? message : '';
        const errorStr = typeof extra['error'] === 'string' ? extra['error'] : '';
        const isRebalancing = messageStr.toLowerCase().includes('rebalancing') || errorStr.toLowerCase().includes('rebalancing');

        if (isRebalancing) return;

        if (level <= logLevel.ERROR) Logger.error(message, JSON.stringify(extra), context);
        else if (level <= logLevel.WARN) Logger.warn(message, context);
        else if (level <= logLevel.INFO) Logger.log(message, context);
        else Logger.debug(message, context);
      };
    };

    const role = this.configService.get<string>('APP_ROLE', 'api');
    const uniqueClientId = `${this.options.config.clientId || 'express-nest-blueprint'}-${role}-${process.pid}`;

    this.kafka = new Kafka({
      ...this.options.config,
      clientId: uniqueClientId,
      logCreator: kafkaLogger
    });

    this.producer = this.kafka.producer({
      ...this.options.producerConfig,
      metadataMaxAge: this.configService.get<number>('KAFKA_METADATA_MAX_AGE', 30000)
    });

    this.consumer = this.kafka.consumer({
      groupId: this.options.consumerConfig?.groupId || 'default-group',
      sessionTimeout: this.configService.get<number>('KAFKA_SESSION_TIMEOUT', 45000),
      rebalanceTimeout: this.configService.get<number>('KAFKA_REBALANCE_TIMEOUT', 90000),
      heartbeatInterval: this.configService.get<number>('KAFKA_HEARBEAT_INTERVAL', 3000),
      metadataMaxAge: this.configService.get<number>('KAFKA_METADATA_MAX_AGE', 30000),
      ...this.options.consumerConfig
    });
  }

  private handlers: Array<{ topic: string | RegExp; handler: KafkaMessageHandler<unknown> }> = [];
  private isRunning = false;
  private connectionPromise: Promise<void> | null = null;

  async connect (): Promise<void> {
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = (async (): Promise<void> => {
      try {
        if (!this.isProducerConnected) {
          await this.producer.connect();
          this.isProducerConnected = true;
        }

        if (!this.isConsumerConnected && this.isWorkerRole) {
          await this.consumer.connect();
          this.isConsumerConnected = true;
        }
      } catch (error) {
        this.connectionPromise = null;
        throw error;
      }
    })();

    return this.connectionPromise;
  }

  async disconnect (): Promise<void> {
    if (this.isProducerConnected) await this.producer.disconnect();
    if (this.isConsumerConnected && this.isWorkerRole) await this.consumer.disconnect();
    this.isProducerConnected = false;
    this.isConsumerConnected = false;
    this.isRunning = false;
  }

  async produce<T = unknown> (payload: KafkaMessagePayload<T>): Promise<void> {
    if (!this.isProducerConnected) await this.connect();

    try {
      await this.producer.send({
        topic: payload.topic,
        messages: [
          {
            key: payload.key ?? null,
            value: JSON.stringify(payload.value),
            headers: payload.headers ?? {},
            ...(payload.timestamp ? { timestamp: payload.timestamp } : {})
          }
        ]
      });

      this.metricsService.recordKafkaMessage(payload.topic, 'producer', 'success');
    } catch (error) {
      this.metricsService.recordKafkaMessage(payload.topic, 'producer', 'error');
      throw error;
    }
  }

  async subscribe (options: KafkaSubscribeOptions, handler: KafkaMessageHandler<unknown>): Promise<void> {
    if (!this.isWorkerRole) return;
    if (!this.isConsumerConnected) await this.connect();
    await this.consumer.subscribe({ topic: options.topic, fromBeginning: options.fromBeginning ?? false });
    this.handlers.push({ topic: options.topic, handler: handler as unknown as KafkaMessageHandler<unknown> });
  }

  async start (): Promise<void> {
    if (!this.isWorkerRole || this.isRunning) return;
    if (!this.isConsumerConnected) await this.connect();
    this.isRunning = true;

    void this.consumer
      .run({
        eachMessage: async ({ topic, partition, message }) => {
          const start = Date.now();
          const isInternalTopic = topic.startsWith('__');

          const matchingHandlers = this.handlers.filter(h => {
            if (typeof h.topic === 'string') return h.topic === topic;
            if (h.topic instanceof RegExp) {
              const isGenericRegex = h.topic.toString() === '/.*/';
              if (isInternalTopic && isGenericRegex) return false;
              return h.topic.test(topic);
            }

            return false;
          });

          if (matchingHandlers.length === 0) return;

          let value: unknown = null;
          if (message.value) {
            try {
              value = JSON.parse(message.value.toString());
            } catch {
              value = message.value.toString();
            }
          }

          const payload = {
            topic,
            partition,
            value,
            key: message.key,
            headers: message.headers as Record<string, string | Buffer | (string | Buffer)[]>,
            timestamp: message.timestamp
          };

          try {
            await Promise.all(
              matchingHandlers.map(async h => {
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
      })
      .catch(error => {
        this.isRunning = false;
        Logger.error('Kafka Consumer run error', getErrorMessage(error), 'KafkaService');
      });
  }

  async getKafkaMetrics (): Promise<{ messagesInPerSec: number; underReplicatedPartitions: number }> {
    const admin = this.kafka.admin();
    await admin.connect();

    const topicMetadata = await admin.fetchTopicMetadata();
    let underReplicatedPartitions = 0;

    topicMetadata.topics.forEach(topic => {
      topic.partitions.forEach(partition => {
        if (partition.replicas.length !== partition.isr.length) {
          underReplicatedPartitions++;
        }
      });
    });

    let currentTotalMessages = 0;

    for (const topic of topicMetadata.topics) {
      if (topic.name.startsWith('__')) continue;

      const offsets = await admin.fetchTopicOffsets(topic.name);

      offsets.forEach(partitionOffset => {
        const highOffset = parseInt(partitionOffset.high ?? '0', 10);
        currentTotalMessages += highOffset;
      });
    }

    await admin.disconnect();

    const now = Date.now();
    const elapsedSeconds = (now - this.lastMetricsTimestamp) / 1000;
    const delta = currentTotalMessages - this.lastTotalMessages;
    const messagesInPerSec = elapsedSeconds > 0 ? Math.max(0, delta / elapsedSeconds) : 0;

    this.lastTotalMessages = currentTotalMessages;
    this.lastMetricsTimestamp = now;

    return {
      messagesInPerSec: parseFloat(messagesInPerSec.toFixed(2)),
      underReplicatedPartitions
    };
  }
}
