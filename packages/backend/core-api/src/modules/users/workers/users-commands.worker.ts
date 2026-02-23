import { Job } from 'bullmq';
import { Injectable, Processor, OnJob, KAFKA_TOPICS, BadRequestException, KafkaService, DatabaseService } from '@config/libs';

import { UsersRepository } from '@modules/users/users.repository';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';
import { CommandJobData } from '@modules/users/interfaces/users-event-payload.interface';
import { CreateHandler } from '@modules/users/workers/command-handlers/create-handler';
import { UpdateHandler } from '@modules/users/workers/command-handlers/update-handler';
import { DeleteHandler } from '@modules/users/workers/command-handlers/delete-handler';

@Injectable()
@Processor('users-commands')
export class UsersCommandsWorker {
  private readonly createHandler: CreateHandler;
  private readonly updateHandler: UpdateHandler;
  private readonly deleteHandler: DeleteHandler;

  constructor (
    usersRepository: UsersRepository,
    private readonly kafkaService: KafkaService,
    databaseService: DatabaseService
  ) {
    this.createHandler = new CreateHandler(usersRepository, kafkaService, databaseService);
    this.updateHandler = new UpdateHandler(usersRepository, kafkaService, databaseService);
    this.deleteHandler = new DeleteHandler(usersRepository, kafkaService);
  }

  @OnJob('user.create')
  async handleCreateUser (job: Job<CommandJobData>): Promise<unknown> {
    const { data } = job.data;
    try {
      return await this.createHandler.handle(job.id as string, data as CreateUserDto);
    } catch (error) {
      await this.handleFailure(job.id as string, 'CREATE', error);
      throw error;
    }
  }

  @OnJob('user.update')
  async handleUpdateUser (job: Job<CommandJobData>): Promise<unknown> {
    const { data, userId, currentUser } = job.data;
    if (!userId) throw new BadRequestException('userId required for UPDATE command');
    try {
      return await this.updateHandler.handle(job.id as string, userId, data as UpdateUserDto, currentUser);
    } catch (error) {
      await this.handleFailure(job.id as string, 'UPDATE', error);
      throw error;
    }
  }

  @OnJob('user.delete')
  async handleDeleteUser (job: Job<CommandJobData>): Promise<void> {
    const { userId, currentUser } = job.data;
    if (!userId) throw new BadRequestException('userId required for DELETE command');
    try {
      await this.deleteHandler.handle(job.id as string, userId, currentUser);
    } catch (error) {
      await this.handleFailure(job.id as string, 'DELETE', error);
      throw error;
    }
  }

  private async handleFailure (jobId: string, command: string, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

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
