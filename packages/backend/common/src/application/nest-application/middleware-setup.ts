import express, { Express, Request, Response, NextFunction, RequestHandler } from 'express';

import { CorsOptions } from '../../domain/interfaces/api/api.interface';

export class MiddlewareSetup {
  setupBasicMiddleware (app: Express): void {
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));
  }

  enableCors (app: Express, options?: CorsOptions): void {
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', options?.origin ?? '*');
      res.header('Access-Control-Allow-Methods', options?.methods ?? 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
      res.header('Access-Control-Allow-Headers', options?.allowedHeaders ?? 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') res.sendStatus(200);
      else next();
    });
  }

  applyMiddleware (app: Express, pathOrMiddleware: string | RequestHandler, middleware?: RequestHandler): Express {
    if (typeof pathOrMiddleware === 'function') app.use(pathOrMiddleware);
    else if (middleware) {
      if (this.hasInvalidPathSyntax(pathOrMiddleware)) return app;
      app.use(pathOrMiddleware, middleware);
    }

    return app;
  }

  hasInvalidPathSyntax (path: string): boolean {
    if (!path || typeof path !== 'string') return false;
    const invalidPatterns = [/:[^a-zA-Z0-9]/, /::/, /:$/, /:[^a-zA-Z0-9_]/, /:\/\//, /http:/, /https:/];
    return invalidPatterns.some(pattern => pattern.test(path));
  }
}
