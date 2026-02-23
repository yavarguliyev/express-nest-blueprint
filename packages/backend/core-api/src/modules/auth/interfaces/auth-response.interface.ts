import { WithEmail, WithFirstName, WithId, WithIsActive, WithIsEmailVerified, WithLastName, WithRole } from '@config/libs';

export interface AuthResponseDto {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthResponseUser;
}

export interface AuthResponseUser extends WithId<number>, WithEmail, WithFirstName, WithLastName, WithRole, WithIsActive, WithIsEmailVerified {}

export interface UserWithPassword extends AuthResponseUser {
  passwordHash: string;
}
