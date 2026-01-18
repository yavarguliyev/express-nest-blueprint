import http from 'http';

import { ConfigService } from '../config/config.service';
import { Injectable } from '../decorators/injectable.decorator';
import { GracefulShutDownServiceConfig } from '../interfaces/common.interface';
import { Logger } from '../logger/logger.service';
import { GracefulShutdownService } from '../services/graceful-shutdown.service';

@Injectable()
export class LifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  constructor (private readonly configService: ConfigService) {}

  private shutdownHandlers: GracefulShutDownServiceConfig[] = [];
  private httpServer: http.Server | null = null;
  private workerStarter?: () => void;
  private isShuttingDown = false;

  registerShutdownHandler (handler: GracefulShutDownServiceConfig): void {
    this.shutdownHandlers.push(handler);
  }

  registerWorkerStarter (starter: () => void): void {
    this.workerStarter = starter;
  }

  startWorkers (): void {
    if (this.workerStarter) {
      this.workerStarter();
    }
  }

  setHttpServer (server: http.Server): void {
    this.httpServer = server;
  }

  async executeGracefulShutdown (): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;

    this.shutdownHandlers.forEach((handler, index) => this.logger.log(`Handler ${index + 1}: ${handler.name}`));

    const gracefulShutdown = new GracefulShutdownService(this.shutdownHandlers, {
      shutdownTimeout: this.configService.get<number>('SHUT_DOWN_TIMER', 3000),
      maxRetries: this.configService.get<number>('SHUTDOWN_RETRIES', 3),
      retryDelay: this.configService.get<number>('SHUTDOWN_RETRY_DELAY', 1000)
    });
    await gracefulShutdown.shutDown(this.httpServer || undefined);
  }

  getShutdownHandlers (): GracefulShutDownServiceConfig[] {
    return [...this.shutdownHandlers];
  }
}
