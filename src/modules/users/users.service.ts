import { extname } from 'path';

import { Injectable } from '@common/decorators/injectable.decorator';
import { Cache } from '@common/decorators/cache.decorator';
import { Compute } from '@common/decorators/compute.decorator';
import { DatabaseService } from '@core/database/database.service';
import { PaginatedResponseDto } from '@common/dtos/paginated-response.dto';
import { BadRequestException, NotFoundException } from '@common/exceptions/http-exceptions';
import { ValidationService } from '@common/services/validation.service';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { FindUsersQueryDto } from '@modules/users/dtos/find-users-query.dto';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';
import { UserResponseDto } from '@modules/users/dtos/user-response.dto';
import { UsersRepository } from '@modules/users/users.repository';
import { StorageService } from '@core/storage/storage.service';
import { Logger } from '@common/logger/logger.service';
import { getErrorMessage } from '@common/helpers/utility-functions.helper';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor (
    private readonly usersRepository: UsersRepository,
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService
  ) {}

  @Cache({ ttl: 60 })
  @Compute({ timeout: 10000 })
  async findAll (queryParams: FindUsersQueryDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { page = 1, limit = 10, search, email, firstName, lastName, isActive, sortBy = 'id', sortOrder = 'DESC' } = await ValidationService.validateQuery(FindUsersQueryDto, queryParams);

    await new Promise((resolve) => setTimeout(resolve, 0));

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
    
    await Promise.all(users.map(async (user) => {
      if (user.profileImageUrl) {
        user.profileImageUrl = await this.storageService.getDownloadUrl(user.profileImageUrl);
      }
    }));

    const responseData = ValidationService.transformResponseArray(UserResponseDto, users);

    return { data: responseData, pagination: { page, limit, total, totalPages } };
  }

  async findOne (id: string): Promise<UserResponseDto> {
    const userId = this.parseAndValidateId(id);
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    if (user.profileImageUrl) {
      user.profileImageUrl = await this.storageService.getDownloadUrl(user.profileImageUrl);
    }

    return ValidationService.transformResponse(UserResponseDto, user);
  }

  async create (createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.databaseService.getWriteConnection().transactionWithRetry(async (transaction) => {
      const existingUser = await this.usersRepository.findByEmail(createUserDto.email, transaction);
      if (existingUser) throw new BadRequestException(`User with email ${createUserDto.email} already exists`);

      const createdUser = await this.usersRepository.create(createUserDto, ['id', 'email', 'firstName', 'lastName', 'isActive', 'createdAt', 'updatedAt'], transaction);
      return ValidationService.transformResponse(UserResponseDto, createdUser!);
    });
  }

  async update (id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const userId = this.parseAndValidateId(id);

    return this.databaseService.getWriteConnection().transactionWithRetry(async (transaction) => {
      const existingUser = await this.usersRepository.findById(userId, transaction);
      if (!existingUser) throw new NotFoundException(`User with ID ${userId} not found`);

      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const userWithEmail = await this.usersRepository.findByEmail(updateUserDto.email, transaction);
        if (userWithEmail) throw new BadRequestException(`User with email ${updateUserDto.email} already exists`);
      }

      const updatedUser = await this.usersRepository.update(userId, updateUserDto, ['id', 'email', 'firstName', 'lastName', 'isActive', 'createdAt', 'updatedAt'], transaction);
      if (!updatedUser) throw new BadRequestException(`Failed to update user with ID ${userId}`);

      return ValidationService.transformResponse(UserResponseDto, updatedUser);
    });
  }

  async remove (id: string): Promise<{ message: string }> {
    const userId = this.parseAndValidateId(id);

    const existingUser = await this.usersRepository.findById(userId);
    if (!existingUser) throw new NotFoundException(`User with ID ${userId} not found`);

    if (existingUser.profileImageUrl) {
      try {
        await this.storageService.delete(existingUser.profileImageUrl);
      } catch (e) {
        this.logger.warn(`Failed to delete user avatar: ${getErrorMessage(e)}`);
      }
    }

    const deleted = await this.usersRepository.delete(userId);
    if (!deleted) throw new BadRequestException(`Failed to delete user with ID ${userId}`);

    return { message: 'User deleted successfully' };
  }

  async updateProfileImage (id: string, file?: Express.Multer.File): Promise<UserResponseDto> {
    if (!file) throw new BadRequestException('No file uploaded or file rejected');

    const userId = this.parseAndValidateId(id);
    
    return this.databaseService.getWriteConnection().transactionWithRetry(async (transaction) => {
      const user = await this.usersRepository.findById(userId, transaction);
      if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

      if (user.profileImageUrl) {
         try {
           await this.storageService.delete(user.profileImageUrl);
         } catch (e) {
           this.logger.warn(`Failed to delete old avatar: ${getErrorMessage(e)}`);
         }
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const key = `avatars/${userId}-${uniqueSuffix}${extname(file.originalname)}`;
      
      this.logger.log(`Attempting to upload avatar to S3 with key: ${key}`);
      
      try {
        await this.storageService.upload(key, file.buffer, file.mimetype);
        this.logger.log(`Successfully uploaded avatar to S3: ${key}`);
      } catch (uploadError) {
        this.logger.error(`S3 upload failed for key ${key}: ${getErrorMessage(uploadError)}`);
        throw new BadRequestException(`Failed to upload avatar to storage: ${getErrorMessage(uploadError)}`);
      }
      
      let imageUrl: string;
      try {
        imageUrl = await this.storageService.getDownloadUrl(key);
        this.logger.log(`Generated presigned URL for ${key}`);
      } catch (urlError) {
        this.logger.error(`Failed to generate presigned URL for ${key}: ${getErrorMessage(urlError)}`);
        throw new BadRequestException(`Failed to generate download URL: ${getErrorMessage(urlError)}`);
      }

      const updatedUser = await this.usersRepository.update(
        userId, 
        { profileImageUrl: key }, 
        ['id', 'email', 'firstName', 'lastName', 'isActive', 'profileImageUrl'], 
        transaction
      );

      const response = ValidationService.transformResponse(UserResponseDto, updatedUser!);
      response.profileImageUrl = imageUrl;
      
      return response;
    });
  }

  async removeProfileImage (id: string): Promise<UserResponseDto> {
    const userId = this.parseAndValidateId(id);

    return this.databaseService.getWriteConnection().transactionWithRetry(async (transaction) => {
       const user = await this.usersRepository.findById(userId, transaction);
       if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

       if (user.profileImageUrl) {
         try {
           await this.storageService.delete(user.profileImageUrl);
         } catch (e) {
            this.logger.warn(`Failed to delete avatar: ${getErrorMessage(e)}`);
         }

         const updatedUser = await this.usersRepository.update(
           userId,
           { profileImageUrl: null },
           ['id', 'email', 'firstName', 'lastName', 'isActive', 'profileImageUrl'],
           transaction
         );
         return ValidationService.transformResponse(UserResponseDto, updatedUser!);
       }
       
       return ValidationService.transformResponse(UserResponseDto, user);
    });
  }

  private parseAndValidateId (id: string): number {
    const userId = parseInt(id, 10);
    if (isNaN(userId) || userId <= 0) throw new BadRequestException('Invalid user ID. ID must be a positive number');

    return userId;
  }
}
