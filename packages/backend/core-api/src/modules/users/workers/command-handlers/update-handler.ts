import { DatabaseService, KafkaService, KAFKA_TOPICS, BadRequestException, InternalServerErrorException, JwtPayload } from '@config/libs';

import { UsersRepository } from '@modules/users/users.repository';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';

export class UpdateHandler {
  constructor (
    private readonly usersRepository: UsersRepository,
    private readonly kafkaService: KafkaService,
    private readonly databaseService: DatabaseService
  ) {}

  async handle (jobId: string, userId: string | number, data: UpdateUserDto, currentUser?: JwtPayload): Promise<unknown> {
    const user = await this.databaseService.getWriteConnection().transactionWithRetry(async transaction => {
      const existingUser = await this.usersRepository.findById(userId, transaction);
      if (!existingUser) throw new BadRequestException(`User with ID ${userId} not found`);

      if (data.email && data.email !== existingUser.email) {
        const userWithEmail = await this.usersRepository.findByEmail(data.email, transaction);
        if (userWithEmail) throw new BadRequestException(`User with email ${data.email} already exists`);
      }

      return this.usersRepository.update(
        userId,
        data,
        ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'updatedAt'],
        transaction,
        currentUser
      );
    });

    if (!user) throw new InternalServerErrorException('Failed to update user');

    await this.kafkaService.produce({
      topic: KAFKA_TOPICS.USER_UPDATED.topic,
      key: `${user.id}`,
      value: {
        type: KAFKA_TOPICS.USER_UPDATED.type,
        jobId,
        entityId: user.id,
        metadata: { user, changes: data },
        timestamp: new Date().toISOString()
      }
    });

    return user;
  }
}
