import { extname } from 'path';
import { Queue } from 'bullmq';

import {
  Injectable,
  InvalidateCache,
  DatabaseService,
  PaginatedResponseDto,
  BadRequestException,
  NotFoundException,
  ValidationService,
  StorageService,
  JwtPayload,
  CACHE_KEYS,
  QueueManager,
  JobResponseDto
} from '@config/libs';

import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { FindUsersQueryDto } from '@modules/users/dtos/find-users-query.dto';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';
import { UserResponseDto } from '@modules/users/dtos/user-response.dto';
import { UsersRepository } from '@modules/users/users.repository';
import { UserCreationService } from './services/user-creation.service';
import { UserUpdateService } from './services/user-update.service';
import { UserQueryService } from './services/user-query.service';

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
    return this.userCreationService.create(this.commandQueue, createUserDto);
  }

  async update (id: string | number, updateUserDto: UpdateUserDto, currentUser?: JwtPayload): Promise<JobResponseDto> {
    const userId = this.userQueryService.parseAndValidateId(id);
    return this.userUpdateService.update(this.commandQueue, userId, updateUserDto, currentUser);
  }

  async remove (id: string | number, currentUser?: JwtPayload): Promise<JobResponseDto> {
    const userId = this.userQueryService.parseAndValidateId(id);
    return this.userUpdateService.remove(this.commandQueue, userId, currentUser);
  }

  @InvalidateCache({ keys: [CACHE_KEYS.USERS.LIST_PREFIX, (id: unknown): string => CACHE_KEYS.USERS.DETAIL(id as string | number)] })
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

      const response = ValidationService.transformResponse(UserResponseDto, updatedUser!);
      response.profileImageUrl = imageUrl;

      return response;
    });
  }

  @InvalidateCache({ keys: [CACHE_KEYS.USERS.LIST_PREFIX, (id: unknown): string => CACHE_KEYS.USERS.DETAIL(id as string | number)] })
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

        return ValidationService.transformResponse(UserResponseDto, updatedUser!);
      }

      return ValidationService.transformResponse(UserResponseDto, user);
    });
  }
}
