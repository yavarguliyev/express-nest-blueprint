import { Expose } from 'class-transformer';
import { IsString, IsBoolean } from 'class-validator';

export class SettingsResponseDto {
  @Expose()
  @IsString()
  id!: string;

  @Expose()
  @IsString()
  label!: string;

  @Expose()
  @IsString()
  description!: string;

  @Expose()
  @IsBoolean()
  value!: boolean;

  @Expose()
  @IsBoolean()
  isActive!: boolean;

  @Expose()
  @IsString()
  category!: string;
}
