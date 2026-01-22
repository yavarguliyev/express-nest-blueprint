import * as jwt from 'jsonwebtoken';

import { Injectable } from '../../core/decorators/injectable.decorator';
import { BadRequestException, UnauthorizedException } from '../../domain/exceptions/http-exceptions';
import { JwtPayload } from '../../domain/interfaces/common.interface';
import { JwtRegisteredClaim, TimeUnit } from '../../domain/types/common.type';
import { ConfigService } from '../../infrastructure/config/config.service';

@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor (private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) throw new BadRequestException('JWT_SECRET must be defined in environment variables');

    this.secret = secret;
    this.expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '24h');
  }

  sign (payload: Omit<JwtPayload, JwtRegisteredClaim>): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      algorithm: 'HS256'
    } as jwt.SignOptions);
  }

  verify (token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      if (typeof decoded === 'string') throw new UnauthorizedException('Invalid token payload');

      return decoded as unknown as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) throw new UnauthorizedException('Token has expired');
      if (error instanceof jwt.JsonWebTokenError) throw new UnauthorizedException('Invalid token');
      throw new UnauthorizedException('Token verification failed');
    }
  }

  getExpiresInSeconds (): number {
    const match = this.expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 24 * 60 * 60;

    const value = match[1];
    const unit = match[2] as TimeUnit;
    const num = Number(value);

    const UNIT_TO_SECONDS: Record<TimeUnit, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    };

    return num * UNIT_TO_SECONDS[unit];
  }
}
