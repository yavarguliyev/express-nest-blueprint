import { Subscriber, OnMessage } from '../../../core/decorators/kafka.decorators';
import { KafkaMessagePayload } from '../../../domain/interfaces/infra/kafka.interface';
import { Logger } from '../../logger/logger.service';

@Subscriber()
export class LoggingSubscriber {
  private readonly logger = new Logger(LoggingSubscriber.name);

  @OnMessage(/.*/)
  async handleAllMessages (payload: KafkaMessagePayload<unknown>): Promise<void> {
    await this.logger.log(`Received message from topic: ${payload.topic}`);
    await this.logger.log(`Message value: ${JSON.stringify(payload.value)}`);
  }
}
