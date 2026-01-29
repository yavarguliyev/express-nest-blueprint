import { Request } from 'express';

import { UserRoles } from '../../enums/auth/auth.enum';

export interface JwtPayload {
  email: string;
  exp?: number;
  iat?: number;
  role: UserRoles;
  sub: number;
}

export interface AuthenticatedRequest extends Omit<Request, 'user'> {
  user: JwtPayload;
}
