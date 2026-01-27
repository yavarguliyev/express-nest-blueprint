import { extname } from 'path';

import {
  Injectable,
  Cache,
  Compute,
  DatabaseService,
  PaginatedResponseDto,
  BadRequestException,
  NotFoundException,
  ValidationService,
  StorageService,
  ForbiddenException,
  JwtPayload
} from '@config/libs';

import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { FindUsersQueryDto } from '@modules/users/dtos/find-users-query.dto';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';
import { UserResponseDto } from '@modules/users/dtos/user-response.dto';
import { UsersRepository } from '@modules/users/users.repository';

@Injectable()
export class UsersService {
  constructor (
    private readonly usersRepository: UsersRepository,
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService
  ) {}

  @Cache({ ttl: 60 })
  @Compute({ timeout: 10000 })
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
        if (user.profileImageUrl) user.profileImageUrl = await this.storageService.getDownloadUrl(user.profileImageUrl);
      })
    );

    const responseData = ValidationService.transformResponseArray(UserResponseDto, users);

    return { data: responseData, pagination: { page, limit, total, totalPages } };
  }

  async findOne (id: string): Promise<UserResponseDto> {
    const userId = this.parseAndValidateId(id);
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    if (user.profileImageUrl) user.profileImageUrl = await this.storageService.getDownloadUrl(user.profileImageUrl);
    return ValidationService.transformResponse(UserResponseDto, user);
  }

  async create (createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.databaseService.getWriteConnection().transactionWithRetry(async transaction => {
      const existingUser = await this.usersRepository.findByEmail(createUserDto.email, transaction);
      if (existingUser) throw new BadRequestException(`User with email ${createUserDto.email} already exists`);

      const createdUser = await this.usersRepository.create(
        createUserDto,
        ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'updatedAt'],
        transaction
      );
      return ValidationService.transformResponse(UserResponseDto, createdUser!);
    });
  }

  async update (id: string | number, updateUserDto: UpdateUserDto, currentUser?: JwtPayload): Promise<UserResponseDto> {
    const userId = this.parseAndValidateId(id);

    if (currentUser && currentUser.sub === userId) {
      if (updateUserDto.isEmailVerified !== undefined || updateUserDto.isActive !== undefined) {
        throw new ForbiddenException('You are not allowed to update sensitive fields (isEmailVerified, isActive) on your own account');
      }
    }

    return this.databaseService.getWriteConnection().transactionWithRetry(async transaction => {
      const existingUser = await this.usersRepository.findById(userId, transaction);
      if (!existingUser) throw new NotFoundException(`User with ID ${userId} not found`);

      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const userWithEmail = await this.usersRepository.findByEmail(updateUserDto.email, transaction);
        if (userWithEmail) throw new BadRequestException(`User with email ${updateUserDto.email} already exists`);
      }

      const updatedUser = await this.usersRepository.update(
        userId,
        updateUserDto,
        ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'updatedAt'],
        transaction,
        currentUser
      );
      if (!updatedUser) throw new BadRequestException(`Failed to update user with ID ${userId}`);

      return ValidationService.transformResponse(UserResponseDto, updatedUser);
    });
  }

  async remove (id: string | number, currentUser?: JwtPayload): Promise<{ message: string }> {
    const userId = this.parseAndValidateId(id);

    if (currentUser && String(currentUser.sub) === String(userId)) throw new ForbiddenException('You cannot delete your own account');

    const existingUser = await this.usersRepository.findById(userId);
    if (!existingUser) throw new NotFoundException(`User with ID ${userId} not found`);

    if (existingUser.profileImageUrl) await this.storageService.delete(existingUser.profileImageUrl);

    const deleted = await this.usersRepository.delete(userId, undefined, currentUser);
    if (!deleted) throw new BadRequestException(`Failed to delete user with ID ${userId}`);

    return { message: 'User deleted successfully' };
  }

  async updateProfileImage (id: string, file?: Express.Multer.File, currentUser?: JwtPayload): Promise<UserResponseDto> {
    if (!file) throw new BadRequestException('No file uploaded or file rejected');

    const userId = this.parseAndValidateId(id);

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

  async removeProfileImage (id: string, currentUser?: JwtPayload): Promise<UserResponseDto> {
    const userId = this.parseAndValidateId(id);

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

  private parseAndValidateId (id: string | number): number {
    const userId = typeof id === 'number' ? id : parseInt(id, 10);
    if (isNaN(userId) || userId <= 0) throw new BadRequestException('Invalid user ID. ID must be a positive number');

    return userId;
  }
}
