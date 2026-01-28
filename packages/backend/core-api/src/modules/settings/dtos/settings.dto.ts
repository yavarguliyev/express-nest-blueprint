import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class SettingValueDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsBoolean()
  value!: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
