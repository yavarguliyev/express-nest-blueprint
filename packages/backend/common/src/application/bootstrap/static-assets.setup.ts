import { isAbsolute, join, resolve } from 'path';
import express, { Request, Response } from 'express';

import { BaseBootstrap } from './base.bootstrap';
import { NestApplication } from '../nest-application';
import { ConfigService } from '../../infrastructure/config/config.service';

export class StaticAssetsSetup {
  static setup (app: NestApplication, bootstrap: BaseBootstrap): void {
    const configService = app.get(ConfigService);
    const options = bootstrap.getOptions();
    const rootDir = options.rootDir || process.cwd();

    const resolvePath = (pathConfig: string | undefined): string => {
      if (!pathConfig) return '';
      return isAbsolute(pathConfig) ? pathConfig : resolve(rootDir, pathConfig);
    };

    const adminPath = resolvePath(configService.get<string>('ADMIN_STATIC_PATH'));
    const adminBaseUrl = configService.get<string>('ADMIN_BASE_URL', '');
    const uploadsPath = resolvePath(configService.get<string>('UPLOADS_STATIC_PATH'));
    const uploadsBaseUrl = configService.get<string>('UPLOADS_BASE_URL', '');

    const expressApp = app.getExpressApp();

    if (adminBaseUrl && adminPath) {
      expressApp.use(adminBaseUrl, express.static(adminPath));
      expressApp.use(`${adminBaseUrl}/*`, (_req: Request, res: Response) => {
        res.sendFile(join(adminPath, 'index.html'), err => err && res.status(500).send('Internal Server Error: Missing static assets'));
      });
    }

    if (uploadsBaseUrl && uploadsPath) expressApp.use(uploadsBaseUrl, express.static(uploadsPath));
  }
}
