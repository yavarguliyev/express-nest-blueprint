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
  JwtPayload,
  KAFKA_TOPICS,
  CACHE_KEYS,
  CIRCUIT_BREAKER_KEYS
} from '@config/libs';

import { FindUsersQueryDto } from '@modules/users/dtos/find-users-query.dto';
import { UserResponseDto } from '@modules/users/dtos/user-response.dto';

@CrudTable({
  category: 'Database Management',
  name: 'users',
  displayName: 'Users',
  commandQueue: 'users-commands',
  operationMapping: {
    create: 'user.create',
    update: 'user.update',
    delete: 'user.delete'
  },
  cacheConfig: {
    prefix: CACHE_KEYS.USERS.LIST_PREFIX,
    detailKey: (id: string | number) => CACHE_KEYS.USERS.DETAIL(id)
  },
  actions: { create: true, update: true, delete: true }
})
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
    const db = connection || this.databaseService.getReadConnection();
    return this.findOne({ email }, db);
  }

  @CircuitBreaker({ key: CIRCUIT_BREAKER_KEYS.POSTGRES })
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

    const db = this.databaseService.getReadConnection();
    const result = await this.findAllWithPagination(options, db);

    return { users: result.data, total: result.total };
  }

  async createPrimary (data: Partial<UserResponseDto>): Promise<UserResponseDto | null> {
    const db = this.databaseService.getWriteConnection();
    const result = await this.create(data, undefined, db);
    return result as UserResponseDto | null;
  }

  async updatePrimary (id: string | number, data: Partial<UserResponseDto>): Promise<UserResponseDto | null> {
    const db = this.databaseService.getWriteConnection();
    const result = await this.update(id, data, undefined, db);
    return result as UserResponseDto | null;
  }

  override async update<K extends keyof UserResponseDto> (
    id: string | number,
    data: Partial<UserResponseDto>,
    returningColumns?: K[],
    connection?: DatabaseAdapter,
    currentUser?: JwtPayload
  ): Promise<Pick<UserResponseDto, K> | null> {
    if (!currentUser) throw new InternalServerErrorException('Security Context Missing');

    if (String(currentUser.sub) === String(id)) {
      const restrictedFields = ['isactive', 'is_active', 'isemailverified', 'is_email_verified', 'role'];
      const hasRestrictedField = Object.keys(data).some(field =>
        restrictedFields.some(restricted => field.toLowerCase() === restricted.toLowerCase())
      );

      if (hasRestrictedField) throw new ForbiddenException('Forbidden account update');
    }

    const sensitiveFields = ['isActive', 'isEmailVerified'];
    const hasSensitiveField = Object.keys(data).some(field => sensitiveFields.some(sensitive => field.toLowerCase() === sensitive.toLowerCase()));

    if (hasSensitiveField && currentUser.role !== UserRoles.GLOBAL_ADMIN) {
      throw new ForbiddenException('Admin required for sensitive fields');
    }

    if (data.role !== undefined && currentUser.role !== UserRoles.GLOBAL_ADMIN)
      throw new ForbiddenException('Admin required for role update');

    const db = connection || this.databaseService.getWriteConnection();
    const updatedUser = await super.update(id, data, returningColumns, db);
    if (!updatedUser) return null;

    if (currentUser?.role === UserRoles.GLOBAL_ADMIN) {
      const fullUser = updatedUser as unknown as UserResponseDto;

      await this.kafkaService.produce({
        topic: KAFKA_TOPICS.USER.topic,
        key: `${fullUser.id || id}_${currentUser.sub}`,
        value: {
          type: KAFKA_TOPICS.USER.type,
          title: KAFKA_TOPICS.USER.title,
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

  override async delete (id: string | number, connection?: DatabaseAdapter, currentUser?: JwtPayload): Promise<boolean> {
    if (!currentUser) throw new InternalServerErrorException('Security Context Missing');
    if (String(currentUser.sub) === String(id)) throw new ForbiddenException('Forbidden self-deletion');
    if (currentUser.role !== UserRoles.GLOBAL_ADMIN) throw new ForbiddenException('Admin required for deletion');

    const db = connection || this.databaseService.getWriteConnection();
    return super.delete(id, db);
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
