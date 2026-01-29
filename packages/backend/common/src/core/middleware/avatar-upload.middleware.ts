import { Request, Response, NextFunction, RequestHandler } from 'express';
import multer, { MulterError } from 'multer';

import { Injectable } from '../decorators/injectable.decorator';
import { BadRequestException } from '../../domain/exceptions/http-exceptions';
import { NestMiddleware } from '../../domain/interfaces/nest/middleware.interface';
import { getErrorMessage } from '../../domain/helpers/utility-functions.helper';

@Injectable()
export class AvatarUploadMiddleware implements NestMiddleware {
  private upload: RequestHandler;

  constructor () {
    const storage = multer.memoryStorage();

    this.upload = multer({
      storage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) return cb(new BadRequestException('Only image files are allowed!'));
        cb(null, true);
      }
    }).single('file');
  }

  use (req: Request, res: Response, next: NextFunction): void {
    this.upload(req, res, (err: unknown) => {
      if (err instanceof MulterError) {
        res.status(400).json({ message: getErrorMessage(err) });
        return;
      } else if (err instanceof Error) {
        res.status(400).json({ message: getErrorMessage(err) });
        return;
      }

      next();
    });
  }
}
