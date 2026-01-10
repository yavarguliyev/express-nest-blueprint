import { Expose } from 'class-transformer';
import { IsOptional, IsString, IsIn } from 'class-validator';

import { SortBy, SortOrder } from '@common/types';
import { SORT_BY_VALUES, SORT_ORDER_VALUES } from '@common/constants';

export abstract class QueryResultsDto {
  @IsOptional()
  @Expose()
  page?: number = 1;

  @IsOptional()
  @Expose()
  limit?: number = 10;

  @IsOptional()
  @Expose()
  @IsString({ message: 'Search term must be a string' })
  search?: string;

  @IsOptional()
  @Expose()
  @IsIn(SORT_BY_VALUES, {
    message: 'sortBy must be one of: id, firstName, lastName, email, createdAt'
  })
  sortBy?: SortBy = 'id';

  @IsOptional()
  @Expose()
  @IsIn(SORT_ORDER_VALUES, { message: 'sortOrder must be ASC or DESC' })
  sortOrder?: SortOrder = 'ASC';
}
