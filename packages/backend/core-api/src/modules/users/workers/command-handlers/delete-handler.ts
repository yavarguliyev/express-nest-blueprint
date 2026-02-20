import { KafkaService, KAFKA_TOPICS, BadRequestException, InternalServerErrorException, JwtPayload } from '@config/libs';

import { UsersRepository } from '@modules/users/users.repository';

export class DeleteHandler {
  constructor (
    private readonly usersRepository: UsersRepository,
    private readonly kafkaService: KafkaService
  ) {}

  async handle (jobId: string, userId: string | number, currentUser?: JwtPayload): Promise<void> {
    const existingUser = await this.usersRepository.findById(userId);
    if (!existingUser) throw new BadRequestException(`User with ID ${userId} not found`);

    const deleted = await this.usersRepository.delete(userId, undefined, currentUser);
    if (!deleted) throw new InternalServerErrorException('Failed to delete user');

    await this.kafkaService.produce({
      topic: KAFKA_TOPICS.USER_DELETED.topic,
      key: `${userId}`,
      value: {
        type: KAFKA_TOPICS.USER_DELETED.type,
        jobId,
        entityId: userId,
        timestamp: new Date().toISOString()
      }
    });
  }
}
