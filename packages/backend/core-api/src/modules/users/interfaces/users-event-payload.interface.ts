import { JwtPayload } from '@config/libs';

import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';

export interface UserEventPayload {
  jobId?: string;
  entityId: string | number;
  metadata?: {
    user?: unknown;
    changes?: unknown;
  };
  error?: string;
}

export interface CommandJobData {
  command: 'CREATE' | 'UPDATE' | 'DELETE';
  data?: CreateUserDto | UpdateUserDto;
  userId?: string | number;
  currentUser?: JwtPayload;
  timestamp: number;
}
