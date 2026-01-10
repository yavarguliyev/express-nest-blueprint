import http from 'http';

import { Injectable } from '@common/decorators';
import { Logger } from '@common/logger';
import { GracefulShutdownService } from '@common/services';
import { GracefulShutDownServiceConfig } from '@common/interfaces';

@Injectable()
export class LifecycleService {
  private readonly logger = new Logger('LifecycleService');
  private shutdownHandlers: GracefulShutDownServiceConfig[] = [];
  private httpServer: http.Server | null = null;

  registerShutdownHandler (handler: GracefulShutDownServiceConfig): void {
    this.shutdownHandlers.push(handler);
  }

  setHttpServer (server: http.Server): void {
    this.httpServer = server;
  }

  async executeGracefulShutdown (): Promise<void> {
    this.logger.log('Initiating graceful shutdown...');

    const gracefulShutdown = new GracefulShutdownService(this.shutdownHandlers);
    await gracefulShutdown.shutDown(this.httpServer || undefined);
  }

  getShutdownHandlers (): GracefulShutDownServiceConfig[] {
    return [...this.shutdownHandlers];
  }
}
