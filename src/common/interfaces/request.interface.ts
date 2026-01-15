import { Request } from 'express';
import { JwtPayload } from '@common/interfaces';

export interface AuthenticatedRequest extends Omit<Request, 'user'> {
  user: JwtPayload;
}
