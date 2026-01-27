import {
  BaseRepository,
  CircuitBreaker,
  CrudTable,
  DatabaseService,
  Injectable,
  QueryAllWithPaginationOptions,
  DatabaseAdapter,
  ForbiddenException,
  InternalServerErrorException,
  StorageService,
  KafkaService,
  UserRoles,
  JwtPayload
} from '@config/libs';

import { FindUsersQueryDto } from '@modules/users/dtos/find-users-query.dto';
import { UserResponseDto } from '@modules/users/dtos/user-response.dto';

@CrudTable({ category: 'Database Management', name: 'users', displayName: 'Users', actions: { create: true, update: true, delete: true } })
@Injectable()
export class UsersRepository extends BaseRepository<UserResponseDto> {
  constructor (
    databaseService: DatabaseService,
    private readonly storageService: StorageService,
    private readonly kafkaService: KafkaService
  ) {
    super(databaseService, 'users', {
      firstName: 'first_name',
      lastName: 'last_name',
      isActive: 'is_active',
      profileImageUrl: 'profile_image_url',
      isEmailVerified: 'is_email_verified',
      password: 'password_hash',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      lastLogin: 'last_login'
    });
  }

  protected getSelectColumns (): string[] {
    return ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'profileImageUrl', 'isEmailVerified', 'createdAt', 'updatedAt', 'lastLogin'];
  }

  override getSearchableFields (): string[] {
    return ['email', 'firstName', 'lastName', 'role'];
  }

  override async retrieveDataWithPagination (page: number, limit: number, search?: string): Promise<{ data: unknown[]; total: number }> {
    const searchTerm = search?.trim();
    const result = await this.findUsersWithPagination({
      page,
      limit,
      ...(searchTerm ? { search: searchTerm } : {})
    });

    await this.applyPostProcessing(result.users);

    return { data: result.users, total: result.total };
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

  override async update<K extends keyof UserResponseDto> (
    id: number,
    data: Partial<UserResponseDto>,
    returningColumns?: K[],
    connection?: DatabaseAdapter,
    currentUser?: JwtPayload
  ): Promise<Pick<UserResponseDto, K> | null> {
    if (!currentUser) throw new InternalServerErrorException('Security Context Missing: Unable to verify user permissions');

    if (currentUser.sub === id) {
      const restrictedFields = ['isactive', 'is_active', 'isemailverified', 'is_email_verified', 'role'];
      const hasRestrictedField = Object.keys(data).some(field =>
        restrictedFields.some(restricted => field.toLowerCase() === restricted.toLowerCase())
      );

      if (hasRestrictedField) throw new ForbiddenException('You are not allowed to update sensitive fields on your own account');
    }

    const sensitiveFields = ['isActive', 'isEmailVerified'];
    const hasSensitiveField = Object.keys(data).some(field => sensitiveFields.some(sensitive => field.toLowerCase() === sensitive.toLowerCase()));

    if (hasSensitiveField && currentUser.role !== UserRoles.GLOBAL_ADMIN) {
      throw new ForbiddenException('Only Global Administrators can modify user activation and email verification status');
    }

    if (data.role !== undefined && currentUser.role !== UserRoles.GLOBAL_ADMIN)
      throw new ForbiddenException('Only Global Administrators can update user roles');

    const updatedUser = await super.update(id, data, returningColumns, connection);
    if (!updatedUser) return null;

    if (currentUser?.role === UserRoles.GLOBAL_ADMIN) {
      const fullUser = updatedUser as unknown as UserResponseDto;

      await this.kafkaService.produce({
        topic: 'notification.events',
        value: {
          type: 'USER_UPDATED',
          title: 'Profile Update',
          message: `${fullUser.email || 'User'} updated`,
          metadata: { changes: data, updatedBy: currentUser?.email },
          entityId: fullUser.id || id,
          entityType: 'user',
          recipientIds: [currentUser.sub],
          timestamp: new Date().toISOString()
        }
      });
    }

    return updatedUser;
  }

  override async delete (id: number, connection?: DatabaseAdapter, currentUser?: JwtPayload): Promise<boolean> {
    if (!currentUser) throw new InternalServerErrorException('Security Context Missing: Unable to verify user permissions');
    if (currentUser.sub === id) throw new ForbiddenException('You cannot delete your own account');
    if (currentUser.role !== UserRoles.GLOBAL_ADMIN) throw new ForbiddenException('Only Global Administrators can delete user accounts');

    return super.delete(id, connection);
  }

  override async applyPostProcessing (data: unknown[]): Promise<void> {
    await this.signProfileImages(data.filter(item => this.hasProfileImageUrl(item)));
  }

  private async signProfileImages (data: Array<{ profileImageUrl?: string }>): Promise<void> {
    await Promise.all(
      data.map(async item => {
        if (!item.profileImageUrl) return;
        item.profileImageUrl = await this.storageService.getDownloadUrl(item.profileImageUrl);
      })
    );
  }

  private hasProfileImageUrl (item: unknown): item is { profileImageUrl?: string } {
    return typeof item === 'object' && item !== null && 'profileImageUrl' in item;
  }
}
