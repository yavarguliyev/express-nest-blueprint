import { Job } from 'bullmq';
import {
  Injectable,
  KafkaService,
  KAFKA_TOPICS,
  DatabaseService,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  Processor,
  OnJob,
  JwtPayload
} from '@config/libs';

import { UsersRepository } from '@modules/users/users.repository';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';
import { CommandJobData } from '@modules/users/interfaces/users-event-payload.interface';

@Injectable()
@Processor('users-commands')
export class UsersCommandsWorker {
  constructor (
    private readonly usersRepository: UsersRepository,
    private readonly kafkaService: KafkaService,
    private readonly databaseService: DatabaseService
  ) {}

  @OnJob('user.create')
  async handleCreateUser (job: Job<CommandJobData>): Promise<unknown> {
    const { data } = job.data;
    return this.handleCreate(job.id as string, data as CreateUserDto);
  }

  @OnJob('user.update')
  async handleUpdateUser (job: Job<CommandJobData>): Promise<unknown> {
    const { data, userId, currentUser } = job.data;
    if (!userId) throw new BadRequestException('userId required for UPDATE command');
    return this.handleUpdate(job.id as string, userId, data as UpdateUserDto, currentUser);
  }

  @OnJob('user.delete')
  async handleDeleteUser (job: Job<CommandJobData>): Promise<void> {
    const { userId, currentUser } = job.data;
    if (!userId) throw new BadRequestException('userId required for DELETE command');
    await this.handleDelete(job.id as string, userId, currentUser);
  }

  private async handleCreate (jobId: string, data: CreateUserDto): Promise<unknown> {
    try {
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
    } catch (error) {
      await this.handleFailure(jobId, 'CREATE', error);
      throw error;
    }
  }

  private async handleUpdate (jobId: string, userId: string | number, data: UpdateUserDto, currentUser?: JwtPayload): Promise<unknown> {
    try {
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
    } catch (error) {
      await this.handleFailure(jobId, 'UPDATE', error);
      throw error;
    }
  }

  private async handleDelete (jobId: string, userId: string | number, currentUser?: JwtPayload): Promise<void> {
    try {
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
    } catch (error) {
      await this.handleFailure(jobId, 'DELETE', error);
      throw error;
    }
  }

  private async handleFailure (jobId: string, command: string, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    Logger.error(`Command ${command} failed for job ${jobId}`, errorMessage, 'UsersCommandsWorker');
    
    await this.kafkaService.produce({
      topic: KAFKA_TOPICS.USER_OPERATION_FAILED.topic,
      key: `${jobId}`,
      value: {
        type: KAFKA_TOPICS.USER_OPERATION_FAILED.type,
        jobId,
        command,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
    });
  }
}
