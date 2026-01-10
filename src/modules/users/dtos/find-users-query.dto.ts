import { Expose } from 'class-transformer';
import { IsOptional, IsString, IsEmail, IsBoolean } from 'class-validator';

import { QueryResultsDto } from '@common/dtos';

export class FindUsersQueryDto extends QueryResultsDto {
  @IsOptional()
  @Expose()
  @IsEmail({}, { message: 'Email filter must be a valid email address' })
  email?: string;

  @IsOptional()
  @Expose()
  @IsString({ message: 'First name filter must be a string' })
  firstName?: string;

  @IsOptional()
  @Expose()
  @IsString({ message: 'Last name filter must be a string' })
  lastName?: string;

  @IsOptional()
  @Expose()
  @IsString({ message: 'Name filter must be a string' })
  name?: string;

  @IsOptional()
  @Expose()
  @IsBoolean({ message: 'isActive filter must be true or false' })
  isActive?: boolean;
}
