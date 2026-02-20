import { Queue } from 'bullmq';
import { Injectable, JobResponseDto, JobStatus } from '@config/libs';

import { CreateUserDto } from '@modules/users/dtos/create-user.dto';

@Injectable()
export class UserCreationService {
  async create (commandQueue: Queue, createUserDto: CreateUserDto): Promise<JobResponseDto> {
    const job = await commandQueue.add('user.create', {
      command: 'CREATE',
      data: createUserDto,
      timestamp: Date.now()
    });

    return {
      jobId: job.id as string,
      status: JobStatus.PENDING,
      message: 'User creation queued'
    };
  }
}
