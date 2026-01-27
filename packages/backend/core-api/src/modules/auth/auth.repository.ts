import { Injectable, BadRequestException, DatabaseService, BaseRepository } from '@config/libs';

import { AuthResponseDto } from '@modules/auth/dtos/auth-response.dto';
import { RegisterDto } from '@modules/auth/dtos/register.dto';
import { AuthResponseUser, UserWithPassword } from '@modules/auth/interfaces/auth-response.interface';

@Injectable()
export class AuthRepository extends BaseRepository<AuthResponseDto> {
  constructor (databaseService: DatabaseService) {
    super(databaseService, 'users', {
      firstName: 'first_name',
      lastName: 'last_name',
      isActive: 'is_active',
      passwordHash: 'password_hash',
      lastLogin: 'last_login',
      isEmailVerified: 'is_email_verified',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  }

  protected getSelectColumns (): string[] {
    return ['id', 'email', 'firstName', 'lastName', 'isActive', 'role', 'passwordHash', 'lastLogin', 'isEmailVerified', 'createdAt', 'updatedAt'];
  }

  async findByEmailWithAuth (email: string): Promise<UserWithPassword> {
    const columns = this.getSelectColumns();
    const { query, params } = this.queryBuilder.buildSelectQuery(columns, { where: { email } });

    const db = this.databaseService.getConnection();
    const result = await db.query(query, params);

    return (result.rows[0] as UserWithPassword) || null;
  }

  async updateLastLogin (userId: number): Promise<void> {
    const { query, params } = this.queryBuilder.buildUpdateQuery(userId, { lastLogin: new Date() }, []);

    const db = this.databaseService.getConnection();
    await db.query(query, params);
  }

  async createWithAuth (userData: RegisterDto): Promise<AuthResponseUser> {
    const alreadyExisting = await this.findByEmailWithAuth(userData.email);
    if (alreadyExisting)
      throw new BadRequestException(`A user with the email "${userData.email}" already exists. Please use a different email address.`);

    const { query, params } = this.queryBuilder.buildInsertQuery({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      passwordHash: userData.passwordHash,
      role: userData.role || 'user',
      isActive: true,
      isEmailVerified: false
    });

    const db = this.databaseService.getConnection();
    const result = await db.query(query, params);

    return (result.rows[0] as AuthResponseUser) || null;
  }
}
