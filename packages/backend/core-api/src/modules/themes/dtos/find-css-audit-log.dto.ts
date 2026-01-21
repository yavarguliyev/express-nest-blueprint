import { Expose } from 'class-transformer';
import { IsOptional, IsBoolean } from 'class-validator';

import { QueryResultsDto } from '@config/libs';

import { CssGradientType, CssStatusType } from '@modules/themes/types/theme.type';

export class FindCssQueryDto extends QueryResultsDto {
  @IsOptional()
  @Expose()
  @IsBoolean({ message: 'isActive filter must be true or false' })
  isActive?: boolean;

  @IsOptional()
  @Expose()
  entityType?: 'token' | 'rule' | 'theme' | 'file';

  @IsOptional()
  @Expose()
  entityId?: string;

  @IsOptional()
  @Expose()
  action?: 'create' | 'update' | 'delete' | 'publish';

  @IsOptional()
  @Expose()
  changedBy?: string;

  @IsOptional()
  @Expose()
  category?: string;

  @IsOptional()
  @Expose()
  isEmpty?: string;

  @IsOptional()
  @Expose()
  appliesToTheme?: string;

  @IsOptional()
  @Expose()
  isImportant?: string;

  @IsOptional()
  @Expose()
  fileId?: string;

  @IsOptional()
  @Expose()
  ruleId?: string;

  @IsOptional()
  @Expose()
  tokenId?: string;

  @IsOptional()
  @Expose()
  propertyName?: string;

  @IsOptional()
  @Expose()
  tokenType?: string;

  @IsOptional()
  @Expose()
  tokenCategory?: string;

  @IsOptional()
  @Expose()
  isSystemGradient?: boolean;

  @IsOptional()
  @Expose()
  isCustomizable?: boolean;

  @IsOptional()
  @Expose()
  gradientType?: CssGradientType;

  @IsOptional()
  @Expose()
  status?: CssStatusType;
}
