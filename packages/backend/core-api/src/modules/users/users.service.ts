import { extname } from 'path';
import { Queue } from 'bullmq';
import {
  ValidationService,
  Injectable,
  InvalidateCache,
  PaginatedResponseDto,
  BadRequestException,
  NotFoundException,
  JwtPayload,
  CACHE_KEYS,
  JobResponseDto,
  DatabaseService,
  StorageService,
  QueueManager
} from '@config/libs';

import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { FindUsersQueryDto } from '@modules/users/dtos/find-users-query.dto';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';
import { UserResponseDto } from '@modules/users/dtos/user-response.dto';
import { UsersRepository } from '@modules/users/users.repository';
import { UserCreationService } from '@modules/users/services/user-creation.service';
import { UserUpdateService } from '@modules/users/services/user-update.service';
import { UserQueryService } from '@modules/users/services/user-query.service';

const resolveCacheUserId = (id: unknown): string | number => {
  if (typeof id === 'string' || typeof id === 'number') return id;
  throw new BadRequestException('Invalid cache key id for user');
};

@Injectable()
export class UsersService {
  private commandQueue: Queue;

  constructor (
    private readonly usersRepository: UsersRepository,
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
    private readonly queueManager: QueueManager,
    private readonly userCreationService: UserCreationService,
    private readonly userUpdateService: UserUpdateService,
    private readonly userQueryService: UserQueryService
  ) {
    this.commandQueue = this.queueManager.createQueue('users-commands');
  }

  async findAll (queryParams: FindUsersQueryDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.userQueryService.findAll(queryParams);
  }

  async findOne (id: string): Promise<UserResponseDto> {
    return this.userQueryService.findOne(id);
  }

  async create (createUserDto: CreateUserDto): Promise<JobResponseDto> {
    return this.userCreationService.create({ commandQueue: this.commandQueue, createUserDto });
  }

  async update (id: string | number, updateUserDto: UpdateUserDto, currentUser?: JwtPayload): Promise<JobResponseDto> {
    const userId = this.userQueryService.parseAndValidateId(id);
    return this.userUpdateService.update({ commandQueue: this.commandQueue, userId, updateUserDto, ...(currentUser ? { currentUser } : {}) });
  }

  async remove (id: string | number, currentUser?: JwtPayload): Promise<JobResponseDto> {
    const userId = this.userQueryService.parseAndValidateId(id);
    return this.userUpdateService.remove({ commandQueue: this.commandQueue, userId, ...(currentUser ? { currentUser } : {}) });
  }

  @InvalidateCache({ keys: [CACHE_KEYS.USERS.LIST_PREFIX, (id: unknown): string => CACHE_KEYS.USERS.DETAIL(resolveCacheUserId(id))] })
  async updateProfileImage (id: string, file?: Express.Multer.File, currentUser?: JwtPayload): Promise<UserResponseDto> {
    if (!file) throw new BadRequestException('No file uploaded or file rejected');

    const userId = this.userQueryService.parseAndValidateId(id);

    return this.databaseService.getWriteConnection().transactionWithRetry(async transaction => {
      const user = await this.usersRepository.findById(userId, transaction);
      if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

      if (user.profileImageUrl) await this.storageService.delete(user.profileImageUrl);

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const key = `avatars/${userId}-${uniqueSuffix}${extname(file.originalname)}`;

      await this.storageService.upload(key, file.buffer, file.mimetype);
      const imageUrl = await this.storageService.getDownloadUrl(key);

      const updatedUser = await this.usersRepository.update(
        userId,
        { profileImageUrl: key },
        ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'profileImageUrl'],
        transaction,
        currentUser
      );
      if (!updatedUser) throw new NotFoundException(`User with ID ${userId} not found`);

      const response = ValidationService.transformResponse(UserResponseDto, updatedUser);
      response.profileImageUrl = imageUrl;

      return response;
    });
  }

  @InvalidateCache({ keys: [CACHE_KEYS.USERS.LIST_PREFIX, (id: unknown): string => CACHE_KEYS.USERS.DETAIL(resolveCacheUserId(id))] })
  async removeProfileImage (id: string, currentUser?: JwtPayload): Promise<UserResponseDto> {
    const userId = this.userQueryService.parseAndValidateId(id);

    return this.databaseService.getWriteConnection().transactionWithRetry(async transaction => {
      const user = await this.usersRepository.findById(userId, transaction);
      if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

      if (user.profileImageUrl) {
        await this.storageService.delete(user.profileImageUrl);

        const updatedUser = await this.usersRepository.update(
          userId,
          { profileImageUrl: null },
          ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'profileImageUrl'],
          transaction,
          currentUser
        );
        if (!updatedUser) throw new NotFoundException(`User with ID ${userId} not found`);

        return ValidationService.transformResponse(UserResponseDto, updatedUser);
      }

      return ValidationService.transformResponse(UserResponseDto, user);
    });
  }
}
