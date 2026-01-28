import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { SettingValueDto } from './settings.dto';

export class UpdateSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingValueDto)
  settings!: SettingValueDto[];
}
