import { Injectable, Cache, Compute } from '@common/decorators';
import { PaginatedResponseDto } from '@common/dtos';
import { BadRequestException, NotFoundException } from '@common/exceptions';
import { ValidationService } from '@common/services';
import { CreateUserDto, FindUsersQueryDto, UpdateUserDto, UserResponseDto } from '@modules/users/dtos';
import { UsersRepository } from '@modules/users/users.repository';

@Injectable()
export class UsersService {
  constructor (private readonly usersRepository: UsersRepository) {}

  @Cache({ ttl: 60 })
  @Compute()
  async findAll (queryParams: FindUsersQueryDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { page = 1, limit = 10, search, email, firstName, lastName, isActive, sortBy = 'id', sortOrder = 'DESC' } = await ValidationService.validateQuery(FindUsersQueryDto, queryParams);

    await this.simulateHeavyLoad();

    const { users, total } = await this.usersRepository.findUsersWithPagination({
      page,
      limit,
      sortBy,
      sortOrder,
      ...(search ? { search } : {}),
      ...(email ? { email } : {}),
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(isActive !== undefined ? { isActiveQuery: isActive } : {})
    });

    const totalPages = Math.ceil(total / limit);
    const responseData = ValidationService.transformResponseArray(UserResponseDto, users);

    return { data: responseData, pagination: { page, limit, total, totalPages } };
  }

  @Cache({ ttl: 60 })
  async findOne (id: string): Promise<UserResponseDto> {
    const userId = this.parseAndValidateId(id);
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    return ValidationService.transformResponse(UserResponseDto, user);
  }

  async create (createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.usersRepository.findByEmail(createUserDto.email);
    if (existingUser) throw new BadRequestException(`User with email ${createUserDto.email} already exists`);

    const createdUser = await this.usersRepository.create(createUserDto, ['id', 'email', 'firstName', 'lastName', 'isActive', 'createdAt', 'updatedAt']);
    const userResponse = ValidationService.transformResponse(UserResponseDto, createdUser);

    return userResponse;
  }

  async update (id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const userId = this.parseAndValidateId(id);

    const existingUser = await this.usersRepository.findById(userId);
    if (!existingUser) throw new NotFoundException(`User with ID ${userId} not found`);

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const userWithEmail = await this.usersRepository.findByEmail(updateUserDto.email);
      if (userWithEmail) throw new BadRequestException(`User with email ${updateUserDto.email} already exists`);
    }

    const updatedUser = await this.usersRepository.update(userId, updateUserDto, ['id', 'email', 'firstName', 'lastName', 'isActive', 'createdAt', 'updatedAt']);
    if (!updatedUser) throw new BadRequestException(`Failed to update user with ID ${userId}`);

    return ValidationService.transformResponse(UserResponseDto, updatedUser);
  }

  async remove (id: string): Promise<{ message: string }> {
    const userId = this.parseAndValidateId(id);

    const existingUser = await this.usersRepository.findById(userId);
    if (!existingUser) throw new NotFoundException(`User with ID ${userId} not found`);

    const deleted = await this.usersRepository.delete(userId);
    if (!deleted) throw new BadRequestException(`Failed to delete user with ID ${userId}`);

    return { message: 'User deleted successfully' };
  }

  private async simulateHeavyLoad (): Promise<void> {
    let sum = 0;
    for (let i = 0; i < 1e8; i++) {
        sum += i;
    }

    return Promise.resolve();
  }

  private parseAndValidateId (id: string): number {
    const userId = parseInt(id, 10);
    if (isNaN(userId) || userId <= 0) throw new BadRequestException('Invalid user ID. ID must be a positive number');

    return userId;
  }
}
