import { WithData } from '@config/libs';

import { UserResponseDto } from '@modules/users/dtos/user-response.dto';
import { BaseUserCommandParams } from '@modules/users/interfaces/user-services.interface';

export type CreatePrimaryUserParams = WithData<Partial<UserResponseDto>>;

export type UpdateUserParams = BaseUserCommandParams;

export type RemoveUserParams = Omit<BaseUserCommandParams, 'updateUserDto'>;
