import * as bcrypt from 'bcrypt';

import { Injectable } from '@common/decorators/injectable.decorator';
import { UnauthorizedException } from '@common/exceptions/http-exceptions';
import { ValidationService } from '@common/services/validation.service';
import { JwtService } from '@common/services/jwt.service';
import { AuthResponseDto } from '@modules/auth/dtos/auth-response.dto';
import { LoginDto } from '@modules/auth/dtos/login.dto';
import { RegisterDto } from '@modules/auth/dtos/register.dto';
import { AuthResponseUser } from '@modules/auth/interfaces/auth-response.interface';
import { AuthRepository } from '@modules/auth/auth.repository';
import { Roles } from '@common/enums/common.enum';

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

  async login (loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailWithAuth(loginDto.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.verifyPassword(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    await this.usersService.updateLastLogin(user.id);

    return this.generateAuthResponse(user);
  }

  private generateAuthResponse (user: AuthResponseUser): AuthResponseDto {
    const payload = { sub: user.id, email: user.email, role: user.role as Roles };

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
