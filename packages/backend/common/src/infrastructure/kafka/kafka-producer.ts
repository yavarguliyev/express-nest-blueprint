import { Producer } from 'kafkajs';

import { MetricsService } from '../metrics/metrics.service';
import { KafkaMessagePayload } from '../../domain/interfaces/infra/kafka.interface';

export class KafkaProducer {
  private producer: Producer;
  private isProducerConnected = false;

  constructor (
    producer: Producer,
    private readonly metricsService: MetricsService
  ) {
    this.producer = producer;
  }

  isConnected = (): boolean => this.isProducerConnected;

  async connect (): Promise<void> {
    if (!this.isProducerConnected) {
      await this.producer.connect();
      this.isProducerConnected = true;
    }
  }

  async disconnect (): Promise<void> {
    if (this.isProducerConnected) await this.producer.disconnect();
    this.isProducerConnected = false;
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
}
