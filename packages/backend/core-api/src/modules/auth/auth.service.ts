import * as bcrypt from 'bcrypt';

import { Injectable, UnauthorizedException, ValidationService, JwtService, UserRoles, ForbiddenException } from '@config/libs';
import { AuthResponseDto } from '@modules/auth/dtos/auth-response.dto';
import { LoginDto } from '@modules/auth/dtos/login.dto';
import { RegisterDto } from '@modules/auth/dtos/register.dto';
import { AuthResponseUser } from '@modules/auth/interfaces/auth-response.interface';
import { AuthRepository } from '@modules/auth/auth.repository';

@Injectable()
export class AuthService {
  constructor (
    private readonly usersService: AuthRepository,
    private readonly jwtService: JwtService
  ) {}

  async register (registerDto: RegisterDto): Promise<AuthResponseDto> {
    const passwordHash = await this.hashPassword(registerDto.password);
    const userData = { ...registerDto, passwordHash, isEmailVerified: true };
    const user = await this.usersService.createWithAuth(userData);

    return this.generateAuthResponse(user);
  }

  async login (loginDto: LoginDto, options?: { allowedRoles?: UserRoles[]; context?: string }): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailWithAuth(loginDto.email);

    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await this.verifyPassword(loginDto.password, user.passwordHash);

    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive || !user.isEmailVerified) throw new UnauthorizedException('Account is deactivated');

    if (options?.allowedRoles && !options.allowedRoles.includes(user.role as UserRoles)) {
      throw new ForbiddenException(`Access denied. Your account does not have the required privileges for ${options.context || 'this service'}.`);
    }

    await this.usersService.updateLastLogin(user.id);

    return this.generateAuthResponse(user);
  }

  private generateAuthResponse (user: AuthResponseUser): AuthResponseDto {
    const payload = { sub: user.id, email: user.email, role: user.role as UserRoles };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.jwtService.getExpiresInSeconds();

    return ValidationService.transformResponse(AuthResponseDto, {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    });
  }

  private async hashPassword (password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  private async verifyPassword (password: string, storedHash: string): Promise<boolean> {
    return bcrypt.compare(password, storedHash);
  }
}
