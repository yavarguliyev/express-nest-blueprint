import { OnMessage, Subscriber, KAFKA_TOPICS, KafkaMessagePayload, CACHE_KEYS, RedisService, Logger } from '@config/libs';

import { UserEventPayload } from '@modules/users/interfaces/users-event-payload.interface';

@Subscriber()
export class UsersSubscriber {
  constructor (private readonly redisService: RedisService) {}

  @OnMessage({ topic: KAFKA_TOPICS.USER.topic, fromBeginning: KAFKA_TOPICS.USER.fromBeginning })
  async handleUserEvents ({ value: { entityId } }: KafkaMessagePayload<UserEventPayload>): Promise<void> {
    await this.invalidateUserCache(entityId);
    Logger.log(`User events processed: Cache invalidated for ID: ${String(entityId)}`, 'UsersSubscriber');
  }

  @OnMessage({ topic: KAFKA_TOPICS.USER_CREATED.topic, fromBeginning: KAFKA_TOPICS.USER_CREATED.fromBeginning })
  async handleUserCreated ({ value: { entityId } }: KafkaMessagePayload<UserEventPayload>): Promise<void> {
    await this.invalidateUserCache(entityId);
    Logger.log(`User created: Cache invalidated for ID: ${String(entityId)}`, 'UsersSubscriber');
  }

  @OnMessage({ topic: KAFKA_TOPICS.USER_UPDATED.topic, fromBeginning: KAFKA_TOPICS.USER_UPDATED.fromBeginning })
  async handleUserUpdated ({ value: { entityId } }: KafkaMessagePayload<UserEventPayload>): Promise<void> {
    await this.invalidateUserCache(entityId);
    Logger.log(`User updated: Cache invalidated for ID: ${String(entityId)}`, 'UsersSubscriber');
  }

  @OnMessage({ topic: KAFKA_TOPICS.USER_DELETED.topic, fromBeginning: KAFKA_TOPICS.USER_DELETED.fromBeginning })
  async handleUserDeleted ({ value: { entityId } }: KafkaMessagePayload<UserEventPayload>): Promise<void> {
    await this.invalidateUserCache(entityId);
    Logger.log(`User deleted: Cache invalidated for ID: ${String(entityId)}`, 'UsersSubscriber');
  }

  @OnMessage({ topic: KAFKA_TOPICS.USER_OPERATION_FAILED.topic, fromBeginning: KAFKA_TOPICS.USER_OPERATION_FAILED.fromBeginning })
  handleUserOperationFailed ({ value: { jobId, error } }: KafkaMessagePayload<UserEventPayload>): void {
    Logger.error(`User operation failed for job ${String(jobId)}`, error || 'Unknown error', 'UsersSubscriber');
  }

  private async invalidateUserCache (entityId: string | number): Promise<void> {
    const client = this.redisService.getClient();
    
    await client.del(CACHE_KEYS.USERS.DETAIL(entityId));

    const listKeys = await client.keys(`${CACHE_KEYS.USERS.LIST_PREFIX}*`);
    if (listKeys.length > 0) {
      await client.del(...listKeys);
    }
  }
}
