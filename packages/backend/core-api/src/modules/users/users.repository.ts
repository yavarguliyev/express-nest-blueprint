import {
  CircuitBreaker,
  CrudTable,
  Injectable,
  DatabaseAdapter,
  JwtPayload,
  CACHE_KEYS,
  CIRCUIT_BREAKER_KEYS,
  BaseRepository,
  DatabaseService,
  StorageService,
  KafkaService,
  hasProfileImageUrl
} from '@config/libs';

import { FindUsersQueryDto } from '@modules/users/dtos/find-users-query.dto';
import { UserResponseDto } from '@modules/users/dtos/user-response.dto';
import { ValidationHelper } from '@modules/users/repository-helpers/validation-helper';
import { UpdateHelper } from '@modules/users/repository-helpers/update-helper';
import { QueryHelper } from '@modules/users/repository-helpers/query-helper';
import { FindUserByEmailParams, UpdatePrimaryUserParams } from '@modules/users/interfaces/user-repository.interface';
import { CreatePrimaryUserParams } from '@modules/users/types/user.type';

@CrudTable({
  category: 'Database Management',
  name: 'users',
  displayName: 'Users',
  commandQueue: 'users-commands',
  operationMapping: { create: 'user.create', update: 'user.update', delete: 'user.delete' },
  cacheConfig: {
    prefix: CACHE_KEYS.USERS.LIST_PREFIX,
    detailKey: (id: string | number) => CACHE_KEYS.USERS.DETAIL(id)
  },
  actions: { create: true, update: true, delete: true }
})
@Injectable()
export class UsersRepository extends BaseRepository<UserResponseDto> {
  private readonly validationHelper: ValidationHelper;
  private readonly updateHelper: UpdateHelper;
  private readonly queryHelper: QueryHelper;

  constructor (
    databaseService: DatabaseService,
    private readonly storageService: StorageService,
    kafkaService: KafkaService
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
    this.validationHelper = new ValidationHelper();
    this.updateHelper = new UpdateHelper(kafkaService);
    this.queryHelper = new QueryHelper(databaseService);
  }

  protected getSelectColumns (): string[] {
    return ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'profileImageUrl', 'isEmailVerified', 'createdAt', 'updatedAt', 'lastLogin'];
  }

  override getSearchableFields (): string[] {
    return ['email', 'firstName', 'lastName', 'role'];
  }

  async findByEmail (params: FindUserByEmailParams): Promise<UserResponseDto | null> {
    const { email, connection } = params;
    const db = connection || this.queryHelper.getReadConnection();
    return this.findOne({ email }, db);
  }

  @CircuitBreaker({ key: CIRCUIT_BREAKER_KEYS.POSTGRES })
  async findUsersWithPagination (opts: FindUsersQueryDto): Promise<{ users: UserResponseDto[]; total: number }> {
    const where = this.queryHelper.buildWhereClause(opts);
    const options = this.queryHelper.buildPaginationOptions(opts, where);
    const db = this.queryHelper.getReadConnection();
    const result = await this.findAllWithPagination(options, db);
    return { users: result.data, total: result.total };
  }

  async createPrimary (params: CreatePrimaryUserParams): Promise<UserResponseDto | null> {
    const { data } = params;
    const db = this.queryHelper.getWriteConnection();
    const result = await this.create(data, undefined, db);
    return result as UserResponseDto | null;
  }

  async updatePrimary (params: UpdatePrimaryUserParams): Promise<UserResponseDto | null> {
    const { id, data } = params;
    const db = this.queryHelper.getWriteConnection();
    const result = await this.update(id, data, undefined, db);
    return result as UserResponseDto | null;
  }

  override async retrieveDataWithPagination (page: number, limit: number, search?: string): Promise<{ data: unknown[]; total: number }> {
    const searchTerm = search?.trim();
    const result = await this.findUsersWithPagination({ page, limit, ...(searchTerm ? { search: searchTerm } : {}) });
    await this.applyPostProcessing(result.users);
    return { data: result.users, total: result.total };
  }

  override async update<K extends keyof UserResponseDto> (
    id: string | number,
    data: Partial<UserResponseDto>,
    returningColumns?: K[],
    connection?: DatabaseAdapter,
    currentUser?: JwtPayload
  ): Promise<Pick<UserResponseDto, K> | null> {
    this.updateHelper.validateSecurityContext(currentUser);
    this.updateHelper.validateSelfUpdate(currentUser!, id, data);
    this.updateHelper.validateSensitiveFields(currentUser!, data);
    this.updateHelper.validateRoleUpdate(currentUser!, data);

    const db = connection || this.queryHelper.getWriteConnection();
    const updatedUser = await super.update(id, data, returningColumns, db);
    if (!updatedUser) return null;
    const fullUser = updatedUser as unknown as UserResponseDto;
    await this.updateHelper.notifyUpdate(currentUser!, id, data, fullUser);

    return updatedUser;
  }

  override async delete (id: string | number, connection?: DatabaseAdapter, currentUser?: JwtPayload): Promise<boolean> {
    this.validationHelper.validateSecurityContext(currentUser);
    this.validationHelper.validateSelfDeletion(currentUser!, id);
    this.validationHelper.validateAdminRole(currentUser!);
    const db = connection || this.queryHelper.getWriteConnection();
    return super.delete(id, db);
  }

  override async applyPostProcessing (data: unknown[]): Promise<void> {
    const itemsWithImages = data.filter(item => hasProfileImageUrl(item));
    await this.signProfileImages(itemsWithImages);
  }

  private async signProfileImages (data: Array<{ profileImageUrl?: string }>): Promise<void> {
    await Promise.all(
      data.map(async item => {
        if (!item.profileImageUrl) return;
        item.profileImageUrl = await this.storageService.getDownloadUrl(item.profileImageUrl);
      })
    );
  }
}
