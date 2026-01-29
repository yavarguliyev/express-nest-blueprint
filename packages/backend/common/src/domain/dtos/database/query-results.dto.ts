import { Expose } from 'class-transformer';
import { IsOptional, IsString, IsIn } from 'class-validator';

import { SORT_BY_VALUES, SORT_ORDER_VALUES } from '../../constants/database/database.const';
import { SortBy, SortOrder } from '../../types/common/util.type';

export abstract class QueryResultsDto {
  @IsOptional()
  @Expose()
  page?: number | undefined = 1;

  @IsOptional()
  @Expose()
  limit?: number | undefined = 10;

  @IsOptional()
  @Expose()
  @IsString({ message: 'Search term must be a string' })
  search?: string | undefined;

  @IsOptional()
  @Expose()
  @IsIn(SORT_BY_VALUES, {
    message: 'sortBy must be one of: id, firstName, lastName, email, createdAt'
  })
  sortBy?: SortBy | undefined = 'id';

  @IsOptional()
  @Expose()
  @IsIn(SORT_ORDER_VALUES, { message: 'sortOrder must be ASC or DESC' })
  sortOrder?: SortOrder | undefined = 'ASC';
}
