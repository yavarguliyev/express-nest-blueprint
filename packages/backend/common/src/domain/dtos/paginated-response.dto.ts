import { Expose, Type } from 'class-transformer';

import { PaginationDto } from '../dtos/pagination.dto';

export class PaginatedResponseDto<T> {
  @Expose()
  data!: T[];

  @Expose()
  @Type(() => PaginationDto)
  pagination!: PaginationDto;
}
