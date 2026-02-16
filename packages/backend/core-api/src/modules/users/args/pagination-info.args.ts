import { ObjectType, Field } from '@config/libs';

@ObjectType()
export class PaginationArgs {
  @Field(() => Number)
  total!: number;

  @Field(() => Number)
  page!: number;

  @Field(() => Number)
  limit!: number;

  @Field(() => Number)
  totalPages!: number;
}
