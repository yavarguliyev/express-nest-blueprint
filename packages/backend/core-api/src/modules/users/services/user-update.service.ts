import { Injectable, ForbiddenException, InternalServerErrorException, JobResponseDto, JobStatus } from '@config/libs';

import { RemoveUserParams, UpdateUserParams } from '@modules/users/types/user.type';

@Injectable()
export class UserUpdateService {
  private resolveJobId (jobId: string | number | undefined, operation: 'deletion' | 'update'): string {
    if (typeof jobId !== 'string') throw new InternalServerErrorException(`Invalid queue job id generated for user ${operation}`);
    return jobId;
  }

  async update (params: UpdateUserParams): Promise<JobResponseDto> {
    const { commandQueue, userId, updateUserDto, currentUser } = params;

    if (currentUser && currentUser.sub === userId) {
      if (updateUserDto.isEmailVerified !== undefined || updateUserDto.isActive !== undefined) {
        throw new ForbiddenException('You are not allowed to update sensitive fields (isEmailVerified, isActive) on your own account');
      }
    }

    const job = await commandQueue.add('user.update', {
      command: 'UPDATE',
      data: updateUserDto,
      userId,
      timestamp: Date.now()
    });

    return {
      jobId: this.resolveJobId(job.id, 'update'),
      status: JobStatus.PENDING,
      message: 'User update queued'
    };
  }

  async remove (params: RemoveUserParams): Promise<JobResponseDto> {
    const { commandQueue, userId, currentUser } = params;

    if (currentUser && String(currentUser.sub) === String(userId)) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const job = await commandQueue.add('user.delete', {
      command: 'DELETE',
      userId,
      data: {},
      timestamp: Date.now()
    });

    return {
      jobId: this.resolveJobId(job.id, 'deletion'),
      status: JobStatus.PENDING,
      message: 'User deletion queued'
    };
  }
}
