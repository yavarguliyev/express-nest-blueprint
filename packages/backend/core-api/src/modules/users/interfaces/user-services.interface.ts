import { Queue } from 'bullmq';
import { JwtPayload } from '@config/libs';

import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';

export interface CreateUserParams {
  commandQueue: Queue;
  createUserDto: CreateUserDto;
}

export interface BaseUserCommandParams {
  commandQueue: Queue;
  userId: number;
  updateUserDto: UpdateUserDto;
  currentUser?: JwtPayload;
}
