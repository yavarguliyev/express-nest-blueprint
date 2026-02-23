import { Kafka, logLevel, LogEntry } from 'kafkajs';

import { Logger } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { MetricsService } from '../metrics/metrics.service';
import { Inject, Injectable } from '../../core/decorators/injectable.decorator';
import { KAFKA_OPTIONS } from '../../core/decorators/kafka.decorators';
import { KafkaMessagePayload, KafkaModuleOptions, KafkaSubscribeOptions } from '../../domain/interfaces/infra/kafka.interface';
import { KafkaMessageHandler } from '../../domain/types/infra/kafka.type';
import { KafkaProducer } from './kafka-producer';
import { KafkaConsumer } from './kafka-consumer';
import { KafkaMessageProcessor } from './kafka-message-handler';
import { KafkaMetrics } from './kafka-metrics';

@Injectable()
export class KafkaService {
  private readonly isWorkerRole: boolean;
  private kafka: Kafka;
  private kafkaProducer: KafkaProducer;
  private kafkaConsumer: KafkaConsumer;
  private messageProcessor: KafkaMessageProcessor;
  private kafkaMetrics: KafkaMetrics;

  private connectionPromise: Promise<void> | null = null;

  constructor(
    @Inject(KAFKA_OPTIONS) private options: KafkaModuleOptions,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService
  ) {
    this.isWorkerRole = this.configService.get<string>('APP_ROLE', 'api').toLowerCase() === 'worker';

    this.kafka = this.createKafkaInstance();

    const producer = this.kafka.producer({
      ...this.options.producerConfig,
      metadataMaxAge: this.configService.get<number>('KAFKA_METADATA_MAX_AGE', 30000)
    });

    const consumer = this.kafka.consumer({
      groupId: this.options.consumerConfig?.groupId || 'default-group',
      sessionTimeout: this.configService.get<number>('KAFKA_SESSION_TIMEOUT', 45000),
      rebalanceTimeout: this.configService.get<number>('KAFKA_REBALANCE_TIMEOUT', 90000),
      heartbeatInterval: this.configService.get<number>('KAFKA_HEARBEAT_INTERVAL', 3000),
      metadataMaxAge: this.configService.get<number>('KAFKA_METADATA_MAX_AGE', 30000),
      ...this.options.consumerConfig
    });

    this.kafkaProducer = new KafkaProducer(producer, this.metricsService);
    this.kafkaConsumer = new KafkaConsumer(consumer, this.isWorkerRole);
    this.messageProcessor = new KafkaMessageProcessor(this.options, this.metricsService);
    this.kafkaMetrics = new KafkaMetrics(this.kafka);
  }

  async connect(): Promise<void> {
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = (async (): Promise<void> => {
      try {
        await this.kafkaProducer.connect();
        await this.kafkaConsumer.connect();
      } catch (error) {
        this.connectionPromise = null;
        throw error;
      }
    })();

    return this.connectionPromise;
  }

  async disconnect(): Promise<void> {
    await this.kafkaProducer.disconnect();
    await this.kafkaConsumer.disconnect();
  }

  async produce<T = unknown>(payload: KafkaMessagePayload<T>): Promise<void> {
    await this.kafkaProducer.produce(payload);
  }

  async subscribe(options: KafkaSubscribeOptions, handler: KafkaMessageHandler<unknown>): Promise<void> {
    await this.kafkaConsumer.subscribe(options, handler);
  }

  async start(): Promise<void> {
    if (!this.isWorkerRole || this.kafkaConsumer.isConsumerRunning()) return;
    if (!this.kafkaConsumer.isConnected()) await this.connect();
    this.kafkaConsumer.setRunning(true);
    this.runConsumer();
  }

  async getKafkaMetrics(): Promise<{ messagesInPerSec: number; underReplicatedPartitions: number }> {
    return this.kafkaMetrics.getKafkaMetrics();
  }

  private createKafkaInstance(): Kafka {
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

    return new Kafka({
      ...this.options.config,
      clientId: uniqueClientId,
      logCreator: kafkaLogger
    });
  }

  private runConsumer(): void {
    const consumer = this.kafkaConsumer.getConsumer();
    const handlers = this.kafkaConsumer.getHandlers();

    void consumer
      .run({ eachMessage: async payload => await this.messageProcessor.processMessage(payload, handlers) })
      .catch(() => this.kafkaConsumer.setRunning(false));
  }
}
