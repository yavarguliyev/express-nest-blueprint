import { DatabaseService, KafkaService, KAFKA_TOPICS, BadRequestException, InternalServerErrorException } from '@config/libs';

import { UsersRepository } from '@modules/users/users.repository';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';

export class CreateHandler {
  constructor (
    private readonly usersRepository: UsersRepository,
    private readonly kafkaService: KafkaService,
    private readonly databaseService: DatabaseService
  ) {}

  async handle (jobId: string, data: CreateUserDto): Promise<unknown> {
    const user = await this.databaseService.getWriteConnection().transactionWithRetry(async transaction => {
      const existingUser = await this.usersRepository.findByEmail(data.email, transaction);
      if (existingUser) throw new BadRequestException(`User with email ${data.email} already exists`);
      return this.usersRepository.create(data, ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'updatedAt'], transaction);
    });

    if (!user) throw new InternalServerErrorException('Failed to create user');

    await this.kafkaService.produce({
      topic: KAFKA_TOPICS.USER_CREATED.topic,
      key: `${user.id}`,
      value: {
        type: KAFKA_TOPICS.USER_CREATED.type,
        jobId,
        entityId: user.id,
        metadata: { user },
        timestamp: new Date().toISOString()
      }
    });

    return user;
  }
}
