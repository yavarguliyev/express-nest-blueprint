import { DatabaseService, DatabaseAdapter, QueryAllWithPaginationOptions } from '@config/libs';

import { FindUsersQueryDto } from '@modules/users/dtos/find-users-query.dto';

export class QueryHelper {
  constructor (private readonly databaseService: DatabaseService) {}

  buildWhereClause (opts: FindUsersQueryDto): Record<string, unknown> {
    const { email, firstName, lastName, isActive } = opts;
    const where: Record<string, unknown> = {};

    if (isActive) where['isActive'] = isActive;
    if (email) where['email'] = email;
    if (firstName) where['firstName'] = firstName;
    if (lastName) where['lastName'] = lastName;

    return where;
  }

  buildPaginationOptions (opts: FindUsersQueryDto, where: Record<string, unknown>): QueryAllWithPaginationOptions {
    const { page, limit, search, sortBy, sortOrder } = opts;

    return {
      page: page ?? 1,
      limit: limit ?? 10,
      searchFields: ['firstName', 'lastName', 'email'],
      orderBy: sortBy ?? 'id',
      orderDirection: sortOrder ?? 'ASC',
      ...(Object.keys(where).length > 0 ? { where } : {}),
      ...(search ? { search } : {})
    };
  }

  getReadConnection (): DatabaseAdapter {
    return this.databaseService.getReadConnection();
  }

  getWriteConnection (): DatabaseAdapter {
    return this.databaseService.getWriteConnection();
  }
}
