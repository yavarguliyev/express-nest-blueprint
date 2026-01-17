import { Expose } from 'class-transformer';

export class AuthResponseDto {
  @Expose()
  accessToken!: string;

  @Expose()
  tokenType!: string;

  @Expose()
  expiresIn!: number;

  @Expose()
  user!: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
  };
}
