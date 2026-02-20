import { Queue } from 'bullmq';
import { Injectable, JwtPayload, ForbiddenException, JobResponseDto, JobStatus } from '@config/libs';

import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';

@Injectable()
export class UserUpdateService {
  async update (commandQueue: Queue, userId: number, updateUserDto: UpdateUserDto, currentUser?: JwtPayload): Promise<JobResponseDto> {
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
      jobId: job.id as string,
      status: JobStatus.PENDING,
      message: 'User update queued'
    };
  }

  async remove (commandQueue: Queue, userId: number, currentUser?: JwtPayload): Promise<JobResponseDto> {
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
      jobId: job.id as string,
      status: JobStatus.PENDING,
      message: 'User deletion queued'
    };
  }
}
