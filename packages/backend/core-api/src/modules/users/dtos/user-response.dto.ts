import { Expose, Type } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id!: number;

  @Expose()
  email?: string | undefined;

  @Expose()
  firstName?: string | undefined;

  @Expose()
  lastName?: string | undefined;

  @Expose()
  role?: string | undefined;

  @Expose()
  isActive?: boolean | undefined;

  @Expose()
  profileImageUrl?: string | null | undefined;

  @Expose()
  isEmailVerified?: boolean | undefined;

  @Expose()
  @Type(() => Date)
  createdAt?: Date | undefined;

  @Expose()
  @Type(() => Date)
  updatedAt?: Date | undefined;
}
