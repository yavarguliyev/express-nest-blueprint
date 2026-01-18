import http from 'http';

import { RetryHelper } from '../helpers/retry.helper';
import { getErrorMessage } from '../helpers/utility-functions.helper';
import { GracefulShutDownServiceConfig } from '../interfaces/common.interface';
import { Logger } from '../logger/logger.service';

export class GracefulShutdownService {
  private readonly logger = new Logger(GracefulShutdownService.name);
  private readonly services: GracefulShutDownServiceConfig[];

  private readonly shutdownTimeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor (services: GracefulShutDownServiceConfig[], config?: { shutdownTimeout: number; maxRetries: number; retryDelay: number }) {
    this.services = services;
    this.shutdownTimeout = config?.shutdownTimeout || 3000;
    this.maxRetries = config?.maxRetries || 3;
    this.retryDelay = config?.retryDelay || 1000;
  }

  public async shutDown (httpServer?: http.Server): Promise<void> {
    let shutdownTimer;

    try {
      this.logger.log('Graceful shutdown initiated...');

      if (httpServer?.listening) {
        this.logger.log('Closing HTTP server...');

        const server = httpServer;

        if ('closeAllConnections' in server && typeof server.closeAllConnections === 'function') {
          (server.closeAllConnections as () => void)();
        }

        if ('closeIdleConnections' in server && typeof server.closeIdleConnections === 'function') {
          (server.closeIdleConnections as () => void)();
        }

        await new Promise<void>((resolve) => {
          server.close((err) => {
            if (err) this.logger.error(`Error closing HTTP server: ${getErrorMessage(err)}`);
            else this.logger.log('HTTP server closed.');
            resolve();
          });
        });
      }

      this.logger.log('Disconnecting services...');
      await this.disconnectServices();
      this.logger.log('All services disconnected.');

      shutdownTimer = this.startShutdownTimer();
    } catch (error) {
      this.logger.error(`Error during shutdown: ${getErrorMessage(error)}`);
    } finally {
      if (shutdownTimer) clearTimeout(shutdownTimer);
      this.logger.log('Finalizing shutdown. Exit 0.');
      process.exit(0);
    }
  }

  private async disconnectServices (): Promise<void> {
    const disconnectPromises = this.services.map((service) =>
      this.retryDisconnect(service).catch((error) => {
        throw error;
      })
    );
    await Promise.all(disconnectPromises);
  }

  private async retryDisconnect (service: GracefulShutDownServiceConfig): Promise<void> {
    await RetryHelper.executeWithRetry(service.disconnect, {
      serviceName: service.name,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      onRetry: (attempt) => this.logger.log(`Retrying ${service.name} disconnect, attempt ${attempt}`)
    });
  }

  private startShutdownTimer () {
    return setTimeout(() => {
      process.exit(1);
    }, this.shutdownTimeout);
  }
}
