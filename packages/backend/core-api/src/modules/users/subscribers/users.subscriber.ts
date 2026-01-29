import { KAFKA_TOPICS, KafkaMessagePayload, Logger, OnMessage, Subscriber } from '@config/libs';

@Subscriber()
export class UsersSubscriber {
  private readonly logger = new Logger(UsersSubscriber.name);

  @OnMessage({ topic: KAFKA_TOPICS.USER.topic, fromBeginning: KAFKA_TOPICS.USER.fromBeginning })
  async handleAllMessages (payload: KafkaMessagePayload<unknown>): Promise<void> {
    await this.logger.log(`Received message from topic: ${payload.topic}`);
    await this.logger.log(`Message value: ${JSON.stringify(payload.value)}`);
  }
}
