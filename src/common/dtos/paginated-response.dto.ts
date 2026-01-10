import { Expose, Type } from 'class-transformer';

import { PaginationDto } from '@common/dtos';

export class PaginatedResponseDto<T> {
  @Expose()
  data!: T[];

  @Expose()
  @Type(() => PaginationDto)
  pagination!: PaginationDto;
}
