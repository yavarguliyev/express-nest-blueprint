import { Expose, Type } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id!: number;

  @Expose()
  email!: string;

  @Expose()
  firstName!: string;

  @Expose()
  lastName!: string;

  @Expose()
  role!: string;

  @Expose()
  isActive!: boolean;

  @Expose()
  profileImageUrl?: string | null | undefined;

  @Expose()
  isEmailVerified!: boolean;

  @Expose()
  @Type(() => Date)
  createdAt!: Date;

  @Expose()
  @Type(() => Date)
  updatedAt!: Date;
}
