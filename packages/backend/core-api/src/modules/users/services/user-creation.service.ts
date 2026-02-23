import { Injectable, InternalServerErrorException, JobResponseDto, JobStatus } from '@config/libs';

import { CreateUserParams } from '@modules/users/interfaces/user-services.interface';

@Injectable()
export class UserCreationService {
  private resolveJobId (jobId: string | number | undefined): string {
    if (typeof jobId !== 'string') throw new InternalServerErrorException('Invalid queue job id generated for user creation');
    return jobId;
  }

  async create (params: CreateUserParams): Promise<JobResponseDto> {
    const { commandQueue, createUserDto } = params;

    const job = await commandQueue.add('user.create', {
      command: 'CREATE',
      data: createUserDto,
      timestamp: Date.now()
    });

    return {
      jobId: this.resolveJobId(job.id),
      status: JobStatus.PENDING,
      message: 'User creation queued'
    };
  }
}
