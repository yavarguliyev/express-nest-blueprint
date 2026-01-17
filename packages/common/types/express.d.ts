import { Request } from 'express';

import { JwtPayload } from '../src/interfaces/common.interface';

declare global {
  namespace Express {
    interface Request {
      filters?: Record<string, unknown>;
      pagination?: {
        page: number;
        limit: number;
      };
      userId?: number;
      validatedParams?: Record<string, string | number | boolean | undefined>;
      user?: JwtPayload;
    }
  }
}
