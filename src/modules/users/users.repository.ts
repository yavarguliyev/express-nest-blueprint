import { CircuitBreaker, CrudTable, Injectable } from '@common/decorators';
import { DatabaseAdapter } from '@common/interfaces';
import { DatabaseService } from '@core/database/database.service';
import { FindUsersQueryDto, UserResponseDto } from '@modules/users/dtos';
import { BaseRepository } from '@shared/database/base.repository';
import { QueryAllWithPaginationOptions } from '@shared/database/interfaces';

@CrudTable({ category: 'User Management', name: 'users', displayName: 'Users' })
@Injectable()
export class UsersRepository extends BaseRepository<UserResponseDto> {
  constructor (databaseService: DatabaseService) {
    super(databaseService, 'users', {
      firstName: 'first_name',
      lastName: 'last_name',
      isActive: 'is_active',
      profileImageUrl: 'profile_image_url',
      isEmailVerified: 'is_email_verified',
      password: 'password_hash',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  protected getSelectColumns (): string[] {
    return ['id', 'email', 'firstName', 'lastName', 'isActive', 'profileImageUrl', 'isEmailVerified', 'createdAt', 'updatedAt'];
  }

  async findByEmail (email: string, connection?: DatabaseAdapter): Promise<UserResponseDto | null> {
    return this.findOne({ email }, connection);
  }

  @CircuitBreaker({ key: 'db_postgresql' })
  async findUsersWithPagination (opts: FindUsersQueryDto): Promise<{ users: UserResponseDto[]; total: number }> {
    const { page, limit, search, email, firstName, lastName, isActive, sortBy, sortOrder } = opts;

    const where: Record<string, unknown> = {};

    if (isActive) where['isActive'] = isActive;
    if (email) where['email'] = email;
    if (firstName) where['firstName'] = firstName;
    if (lastName) where['lastName'] = lastName;

    const options: QueryAllWithPaginationOptions = {
      page: page ?? 1,
      limit: limit ?? 10,
      searchFields: ['firstName', 'lastName', 'email'],
      orderBy: sortBy ?? 'id',
      orderDirection: sortOrder ?? 'ASC',
      ...(Object.keys(where).length > 0 ? { where } : {}),
      ...(search ? { search } : {})
    };

    const result = await this.findAllWithPagination(options);

    return { users: result.data, total: result.total };
  }
}
