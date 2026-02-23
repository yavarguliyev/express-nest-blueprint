import http from 'http';

import { GracefulShutdownService } from '../services/graceful-shutdown.service';
import { Injectable } from '../../core/decorators/injectable.decorator';
import { GracefulShutDownServiceConfig } from '../../domain/interfaces/infra/infra-common.interface';
import { ConfigService } from '../../infrastructure/config/config.service';
import { Logger } from '../../infrastructure/logger/logger.service';

@Injectable()
export class LifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  private shutdownHandlers: GracefulShutDownServiceConfig[] = [];
  private httpServer: http.Server | null = null;
  private isShuttingDown = false;
  private workerStarter?: () => void;

  constructor(private readonly configService: ConfigService) {}

  registerShutdownHandler = (handler: GracefulShutDownServiceConfig): void => void this.shutdownHandlers.push(handler);
  registerWorkerStarter = (starter: () => void): void => void (this.workerStarter = starter);
  getShutdownHandlers = (): GracefulShutDownServiceConfig[] => [...this.shutdownHandlers];
  setHttpServer = (server: http.Server): void => void (this.httpServer = server);
  startWorkers = (): void => this.workerStarter?.();

  async executeGracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    this.logHandlers();
    const shutdownService = this.createShutdownService();
    await shutdownService.shutDown(this.httpServer || undefined);
  }

  private logHandlers(): void {
    this.shutdownHandlers.forEach((h, i) => void this.logger.log(`Handler ${i + 1}: ${h.name}`));
  }

  private createShutdownService(): GracefulShutdownService {
    return new GracefulShutdownService(this.shutdownHandlers, {
      shutdownTimeout: this.configService.get<number>('SHUT_DOWN_TIMER', 15000),
      maxRetries: this.configService.get<number>('SHUTDOWN_RETRIES', 3),
      retryDelay: this.configService.get<number>('SHUTDOWN_RETRY_DELAY', 1000)
    });
  }
}
