import {
  ValidationService,
  Injectable,
  Cache,
  Compute,
  PaginatedResponseDto,
  NotFoundException,
  BadRequestException,
  CACHE_TTL_1_MIN,
  CACHE_KEYS,
  COMPUTE_TIMEOUT_DEFAULT,
  CACHE_TTL_1_HOUR,
  StorageService
} from '@config/libs';

import { FindUsersQueryDto } from '@modules/users/dtos/find-users-query.dto';
import { UserResponseDto } from '@modules/users/dtos/user-response.dto';
import { UsersRepository } from '@modules/users/users.repository';

@Injectable()
export class UserQueryService {
  constructor (
    private readonly usersRepository: UsersRepository,
    private readonly storageService: StorageService
  ) {}

  parseAndValidateId (id: string | number): number {
    const userId = typeof id === 'number' ? id : parseInt(id, 10);
    if (isNaN(userId) || userId <= 0) throw new BadRequestException('Invalid user ID. ID must be a positive number');
    return userId;
  }

  @Cache({ ttl: CACHE_TTL_1_MIN })
  @Compute({ timeout: COMPUTE_TIMEOUT_DEFAULT })
  async findAll (queryParams: FindUsersQueryDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    const {
      page = 1,
      limit = 10,
      search,
      email,
      firstName,
      lastName,
      isActive,
      sortBy = 'id',
      sortOrder = 'DESC'
    } = await ValidationService.validateQuery(FindUsersQueryDto, queryParams);

    await new Promise(resolve => setTimeout(resolve, 0));

    const { users, total } = await this.usersRepository.findUsersWithPagination({
      page,
      limit,
      sortBy,
      sortOrder,
      ...(search ? { search } : {}),
      ...(email ? { email } : {}),
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(isActive !== undefined ? { isActive } : {})
    });

    const totalPages = Math.ceil(total / limit);

    await Promise.all(
      users.map(async user => {
        if (user.profileImageUrl) {
          user.profileImageUrl = await this.storageService.getDownloadUrl(user.profileImageUrl);
        }
      })
    );

    const responseData = ValidationService.transformResponseArray(UserResponseDto, users);

    return { data: responseData, pagination: { page, limit, total, totalPages } };
  }

  @Cache({ ttl: CACHE_TTL_1_HOUR, key: (id: unknown): string => CACHE_KEYS.USERS.DETAIL(id as string | number) })
  async findOne (id: string): Promise<UserResponseDto> {
    const userId = this.parseAndValidateId(id);
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    if (user.profileImageUrl) user.profileImageUrl = await this.storageService.getDownloadUrl(user.profileImageUrl);
    return ValidationService.transformResponse(UserResponseDto, user);
  }
}
