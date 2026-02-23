import { DatabaseAdapter, WithData, WithId } from '@config/libs';

import { UserResponseDto } from '@modules/users/dtos/user-response.dto';

export interface FindUserByEmailParams {
  email: string;
  connection?: DatabaseAdapter;
}

export interface UpdatePrimaryUserParams extends WithId<string | number>, WithData<Partial<UserResponseDto>> {}
